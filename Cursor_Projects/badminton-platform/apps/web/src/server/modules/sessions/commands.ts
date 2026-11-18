import 'server-only';
import { formatSessionRange, formatWhen } from '@bp/domain';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Account } from '../../auth';
import { audit } from '../../audit';
import { ForbiddenError, isUuid } from '../../authz';
import { db, type Tx } from '../../db';
import { clubMembers, clubs, courts, players, registrations, sessionCourts, sessionInvites, sessions } from '../../db/schema';
import { sendEmail } from '../../email';
import { requireActor } from '../members/commands';
import { notifyAccount, notifyPlayer } from '../notifications/notify';
import { notificationText } from '../notifications/text';
import { isLateCancellation, registrationWindow } from './rules';
import { toSessionValues, type SessionFormInput } from './validation';

export class SessionError extends Error {}
export class SessionValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super('Please correct the highlighted fields.');
  }
}

type Email = { to: string; subject: string; text: string };
const isOrganiser = (r: string) => r !== 'player';

async function flush(emails: Email[]) {
  for (const e of emails) await sendEmail(e);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Loads a session with its club, locking the session row so registrations never race. */
async function lockSession(tx: Tx, sessionId: string) {
  if (!isUuid(sessionId)) throw new SessionError('Session not found.');
  const [row] = await tx
    .select({ s: sessions, timeZone: clubs.timeZone, clubName: clubs.name })
    .from(sessions)
    .innerJoin(clubs, eq(clubs.id, sessions.clubId))
    .where(eq(sessions.id, sessionId))
    .for('update', { of: sessions });
  if (!row) throw new SessionError('Session not found.');
  return { ...row.s, timeZone: row.timeZone, clubName: row.clubName };
}
type LockedSession = Awaited<ReturnType<typeof lockSession>>;

const payloadOf = (s: LockedSession) => ({ sessionTitle: s.title, when: formatWhen(s.startsAt, s.timeZone), sessionId: s.id });

async function canActFor(tx: Tx, accountId: string, playerId: string): Promise<boolean> {
  if (!isUuid(playerId)) return false;
  const [p] = await tx
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), isNull(players.deletedAt), sql`(${players.accountId} = ${accountId} or ${players.managedByAccountId} = ${accountId})`))
    .limit(1);
  return !!p;
}

async function isActiveMember(tx: Tx, clubId: string, playerId: string) {
  const [m] = await tx
    .select({ id: clubMembers.playerId })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.playerId, playerId), eq(clubMembers.status, 'active')))
    .limit(1);
  return !!m;
}

async function activeRegistration(tx: Tx, sessionId: string, playerId: string) {
  const [r] = await tx
    .select()
    .from(registrations)
    .where(and(eq(registrations.sessionId, sessionId), eq(registrations.playerId, playerId), sql`${registrations.status} <> 'cancelled'`))
    .limit(1);
  return r ?? null;
}

async function registeredCount(tx: Tx, sessionId: string) {
  const [r] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(eq(registrations.sessionId, sessionId), eq(registrations.status, 'registered')));
  return r?.n ?? 0;
}

/** Re-numbers the waiting list 1..n in its current order (or in `order` when given). */
async function renumberWaitlist(tx: Tx, sessionId: string, order?: string[]) {
  const ids =
    order ??
    (
      await tx
        .select({ id: registrations.id })
        .from(registrations)
        .where(and(eq(registrations.sessionId, sessionId), eq(registrations.status, 'waitlisted')))
        .orderBy(asc(registrations.waitlistPosition))
    ).map((r) => r.id);
  if (!ids.length) return;
  // Shift everyone above the current maximum first, so no temporary number can clash with the unique index.
  await tx.execute(sql`
    update registrations set waitlist_position = waitlist_position + (
      select coalesce(max(waitlist_position), 0) + ${ids.length} + 1 from registrations where session_id = ${sessionId} and status = 'waitlisted')
    where session_id = ${sessionId} and status = 'waitlisted'`);
  for (let i = 0; i < ids.length; i++) await tx.update(registrations).set({ waitlistPosition: i + 1 }).where(eq(registrations.id, ids[i]!));
}

async function nextWaitlistPosition(tx: Tx, sessionId: string) {
  const [r] = await tx
    .select({ n: sql<number>`coalesce(max(${registrations.waitlistPosition}), 0)::int` })
    .from(registrations)
    .where(and(eq(registrations.sessionId, sessionId), eq(registrations.status, 'waitlisted')));
  return (r?.n ?? 0) + 1;
}

function emailFor(to: string | null | undefined, type: string, payload: Record<string, string | number | null>): Email[] {
  if (!to) return [];
  const subjects: Record<string, string> = {
    promoted: `You have a place: ${payload.sessionTitle}`,
    session_cancelled: `Cancelled: ${payload.sessionTitle}`,
    session_changed: `Changed: ${payload.sessionTitle}`,
  };
  return subjects[type] ? [{ to, subject: subjects[type]!, text: notificationText(type, payload) }] : [];
}

/** Moves the first person on the waiting list into a place, if there is room. */
async function promoteWhileRoom(tx: Tx, s: LockedSession, emails: Email[]) {
  for (;;) {
    if ((await registeredCount(tx, s.id)) >= s.capacity) return;
    const [first] = await tx
      .select()
      .from(registrations)
      .where(and(eq(registrations.sessionId, s.id), eq(registrations.status, 'waitlisted')))
      .orderBy(asc(registrations.waitlistPosition))
      .limit(1);
    if (!first) return;
    await tx.update(registrations).set({ status: 'registered', waitlistPosition: null }).where(eq(registrations.id, first.id));
    await renumberWaitlist(tx, s.id);
    const p = payloadOf(s);
    const who = await notifyPlayer(tx, first.playerId, s.clubId, 'promoted', p);
    emails.push(...emailFor(who?.email, 'promoted', p));
    await audit(tx, { clubId: s.clubId, actorAccountId: null, action: 'registration.promoted', entityType: 'registration', entityId: first.id });
  }
}

async function notifyOrganisers(tx: Tx, s: LockedSession, type: string) {
  const orgs = await tx
    .select({ accountId: players.accountId })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .where(and(eq(clubMembers.clubId, s.clubId), eq(clubMembers.status, 'active'), sql`${clubMembers.role} in ('owner','admin','organiser')`));
  for (const o of orgs) if (o.accountId) await notifyAccount(tx, o.accountId, s.clubId, type, payloadOf(s));
}

const WINDOW_MESSAGES: Record<string, string> = {
  draft: 'Registration has not opened yet.',
  not_open: 'Registration has not opened yet.',
  closed: 'Registration has closed. Contact the organiser.',
  started: 'This session has already started. Contact the organiser.',
  ended: 'This session has ended.',
  cancelled: 'This session was cancelled.',
};

// ---------------------------------------------------------------------------
// players: register and cancel (for themselves or their child)
// ---------------------------------------------------------------------------

export async function register(account: Account, sessionId: string, playerId: string): Promise<{ status: 'registered' | 'waitlisted'; position?: number }> {
  return db().transaction(async (tx) => {
    const s = await lockSession(tx, sessionId);
    if (!(await canActFor(tx, account.id, playerId))) throw new ForbiddenError();
    if (!(await isActiveMember(tx, s.clubId, playerId))) throw new SessionError('Join the club before registering.');
    const window = registrationWindow(s);
    if (window !== 'open') throw new SessionError(WINDOW_MESSAGES[window] ?? 'Registration is not open.');
    if (s.visibility === 'invited') {
      const [inv] = await tx.select().from(sessionInvites).where(and(eq(sessionInvites.sessionId, s.id), eq(sessionInvites.playerId, playerId))).limit(1);
      if (!inv) throw new SessionError('This session is by invitation only.');
    }
    const existing = await activeRegistration(tx, s.id, playerId);
    if (existing) return { status: existing.status as 'registered' | 'waitlisted', position: existing.waitlistPosition ?? undefined };

    if ((await registeredCount(tx, s.id)) < s.capacity) {
      await tx.insert(registrations).values({ sessionId: s.id, clubId: s.clubId, playerId, status: 'registered', actedBy: account.id });
      await notifyPlayer(tx, playerId, s.clubId, 'registration_confirmed', payloadOf(s));
      return { status: 'registered' };
    }
    const position = await nextWaitlistPosition(tx, s.id);
    await tx.insert(registrations).values({ sessionId: s.id, clubId: s.clubId, playerId, status: 'waitlisted', waitlistPosition: position, actedBy: account.id });
    await notifyPlayer(tx, playerId, s.clubId, 'waitlisted', { ...payloadOf(s), position });
    return { status: 'waitlisted', position };
  });
}

export async function cancelRegistration(account: Account, sessionId: string, playerId: string) {
  const emails: Email[] = [];
  await db().transaction(async (tx) => {
    const s = await lockSession(tx, sessionId);
    if (!(await canActFor(tx, account.id, playerId))) throw new ForbiddenError();
    const reg = await activeRegistration(tx, s.id, playerId);
    if (!reg) return;
    if (new Date() >= s.startsAt) throw new SessionError('This session has already started. Tell the organiser instead.');
    await tx
      .update(registrations)
      .set({ status: 'cancelled', waitlistPosition: null, cancelledAt: new Date(), lateCancellation: reg.status === 'registered' && isLateCancellation(s.startsAt), actedBy: account.id })
      .where(eq(registrations.id, reg.id));
    if (reg.status === 'waitlisted') {
      await renumberWaitlist(tx, s.id);
    } else if (registrationWindow(s) === 'open') {
      await promoteWhileRoom(tx, s, emails);
    } else {
      await notifyOrganisers(tx, s, 'spot_free_after_close');
    }
  });
  await flush(emails);
}

// ---------------------------------------------------------------------------
// organisers: manage registrations
// ---------------------------------------------------------------------------

async function organiserSession(tx: Tx, account: Account, sessionId: string) {
  const s = await lockSession(tx, sessionId);
  await requireActor(tx, account.id, s.clubId, isOrganiser);
  return s;
}

/** Gives a member a place, even over capacity (the page warns first). */
export async function organiserAdd(account: Account, sessionId: string, playerId: string): Promise<{ overCapacity: boolean }> {
  return db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    if (!(await isActiveMember(tx, s.clubId, playerId))) throw new SessionError('Only club members can be added.');
    const existing = await activeRegistration(tx, s.id, playerId);
    if (existing?.status === 'registered') return { overCapacity: false };
    if (existing) {
      await tx.update(registrations).set({ status: 'registered', waitlistPosition: null, actedBy: account.id }).where(eq(registrations.id, existing.id));
      await renumberWaitlist(tx, s.id);
    } else {
      await tx.insert(registrations).values({ sessionId: s.id, clubId: s.clubId, playerId, status: 'registered', actedBy: account.id });
    }
    await notifyPlayer(tx, playerId, s.clubId, 'registration_added', payloadOf(s));
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'registration.organiser_added', entityType: 'player', entityId: playerId });
    return { overCapacity: (await registeredCount(tx, s.id)) > s.capacity };
  });
}

export async function organiserMoveToWaitlist(account: Account, sessionId: string, playerId: string) {
  await db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    const reg = await activeRegistration(tx, s.id, playerId);
    if (!reg || reg.status !== 'registered') throw new SessionError('This person does not have a place.');
    const position = await nextWaitlistPosition(tx, s.id);
    await tx.update(registrations).set({ status: 'waitlisted', waitlistPosition: position, actedBy: account.id }).where(eq(registrations.id, reg.id));
    await notifyPlayer(tx, playerId, s.clubId, 'moved_to_waitlist', { ...payloadOf(s), position });
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'registration.moved_to_waitlist', entityType: 'player', entityId: playerId });
  });
}

export async function moveInWaitlist(account: Account, sessionId: string, playerId: string, direction: 'up' | 'down') {
  await db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    const list = await tx
      .select({ id: registrations.id, playerId: registrations.playerId })
      .from(registrations)
      .where(and(eq(registrations.sessionId, s.id), eq(registrations.status, 'waitlisted')))
      .orderBy(asc(registrations.waitlistPosition));
    const i = list.findIndex((r) => r.playerId === playerId);
    const j = direction === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    await renumberWaitlist(tx, s.id, list.map((r) => r.id));
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'registration.waitlist_reordered', entityType: 'player', entityId: playerId, after: { direction } });
  });
}

export async function organiserRemove(account: Account, sessionId: string, playerId: string) {
  const emails: Email[] = [];
  await db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    const reg = await activeRegistration(tx, s.id, playerId);
    if (!reg) return;
    await tx.update(registrations).set({ status: 'cancelled', waitlistPosition: null, cancelledAt: new Date(), actedBy: account.id }).where(eq(registrations.id, reg.id));
    await notifyPlayer(tx, playerId, s.clubId, 'registration_removed', payloadOf(s));
    if (reg.status === 'waitlisted') await renumberWaitlist(tx, s.id);
    else if (registrationWindow(s) === 'open') await promoteWhileRoom(tx, s, emails);
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'registration.organiser_removed', entityType: 'player', entityId: playerId });
  });
  await flush(emails);
}

// ---------------------------------------------------------------------------
// organisers: create, edit, open, cancel, duplicate sessions
// ---------------------------------------------------------------------------

async function clubCourtIds(tx: Tx, clubId: string, ids: string[]) {
  const rows = await tx
    .select({ id: courts.id })
    .from(courts)
    .where(and(eq(courts.clubId, clubId), isNull(courts.archivedAt), inArray(courts.id, ids)));
  if (rows.length !== new Set(ids).size) throw new SessionValidationError({ courtIds: 'Choose courts from this club' });
  return rows.map((r) => r.id);
}

export async function createSession(account: Account, clubId: string, form: SessionFormInput, now = new Date()) {
  return db().transaction(async (tx) => {
    await requireActor(tx, account.id, clubId, isOrganiser);
    const [club] = await tx.select({ timeZone: clubs.timeZone }).from(clubs).where(eq(clubs.id, clubId)).limit(1);
    const { errors, values } = toSessionValues(form, club!.timeZone, now);
    if (Object.keys(errors).length) throw new SessionValidationError(errors);
    const courtIds = await clubCourtIds(tx, clubId, form.courtIds);
    const [s] = await tx
      .insert(sessions)
      .values({ clubId, ...values, status: form.publish ? 'open' : 'draft', createdBy: account.id })
      .returning({ id: sessions.id });
    await tx.insert(sessionCourts).values(courtIds.map((courtId) => ({ sessionId: s!.id, clubId, courtId })));
    await audit(tx, { clubId, actorAccountId: account.id, action: 'session.created', entityType: 'session', entityId: s!.id, after: { title: values.title, startsAt: values.startsAt.toISOString(), capacity: values.capacity } });
    return s!.id;
  });
}

export async function updateSession(account: Account, sessionId: string, form: SessionFormInput, now = new Date()) {
  const emails: Email[] = [];
  await db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    if (s.status === 'cancelled' || now >= s.startsAt) throw new SessionError('Started or cancelled sessions cannot be edited.');
    const { errors, values } = toSessionValues(form, s.timeZone, now);
    if (Object.keys(errors).length) throw new SessionValidationError(errors);
    const courtIds = await clubCourtIds(tx, s.clubId, form.courtIds);

    await tx
      .update(sessions)
      .set({ ...values, registrationOpensAt: s.registrationOpensAt < values.registrationClosesAt ? s.registrationOpensAt : values.registrationOpensAt, version: s.version + 1 })
      .where(eq(sessions.id, s.id));
    await tx.delete(sessionCourts).where(eq(sessionCourts.sessionId, s.id));
    await tx.insert(sessionCourts).values(courtIds.map((courtId) => ({ sessionId: s.id, clubId: s.clubId, courtId })));
    const updated = { ...s, ...values };

    // Capacity reduced below current places: the most recent registrations move to the top of the waiting list.
    const placed = await tx
      .select({ id: registrations.id, playerId: registrations.playerId })
      .from(registrations)
      .where(and(eq(registrations.sessionId, s.id), eq(registrations.status, 'registered')))
      .orderBy(asc(registrations.registeredAt));
    if (placed.length > values.capacity) {
      const moved = placed.slice(values.capacity);
      const waiting = await tx
        .select({ id: registrations.id })
        .from(registrations)
        .where(and(eq(registrations.sessionId, s.id), eq(registrations.status, 'waitlisted')))
        .orderBy(asc(registrations.waitlistPosition));
      // Each moved row gets a distinct temporary position after the current list, then everything is renumbered.
      const start = (await nextWaitlistPosition(tx, s.id)) + waiting.length;
      for (let k = 0; k < moved.length; k++) await tx.update(registrations).set({ status: 'waitlisted', waitlistPosition: start + k }).where(eq(registrations.id, moved[k]!.id));
      await renumberWaitlist(tx, s.id, [...moved.map((m) => m.id), ...waiting.map((w) => w.id)]);
      for (let k = 0; k < moved.length; k++) await notifyPlayer(tx, moved[k]!.playerId, s.clubId, 'moved_to_waitlist', { ...payloadOf(updated), position: k + 1 });
    } else if (registrationWindow(updated, now) === 'open') {
      await promoteWhileRoom(tx, updated, emails);
    }

    // Time or venue changed: tell everyone registered or waiting.
    const changes: string[] = [];
    if (values.startsAt.getTime() !== s.startsAt.getTime() || values.endsAt.getTime() !== s.endsAt.getTime())
      changes.push(`new time ${formatSessionRange(values.startsAt, values.endsAt, s.timeZone)}`);
    if (values.venue !== s.venue) changes.push(`new venue ${values.venue || '(not set)'}`);
    if (changes.length) {
      const people = await tx
        .select({ playerId: registrations.playerId })
        .from(registrations)
        .where(and(eq(registrations.sessionId, s.id), sql`${registrations.status} <> 'cancelled'`));
      const payload = { ...payloadOf(updated), change: changes.join('; ') };
      for (const p of people) {
        const who = await notifyPlayer(tx, p.playerId, s.clubId, 'session_changed', payload);
        emails.push(...emailFor(who?.email, 'session_changed', payload));
      }
    }
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'session.updated', entityType: 'session', entityId: s.id, before: { startsAt: s.startsAt.toISOString(), capacity: s.capacity, venue: s.venue }, after: { startsAt: values.startsAt.toISOString(), capacity: values.capacity, venue: values.venue } });
  });
  await flush(emails);
}

export async function openSession(account: Account, sessionId: string) {
  await db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    if (s.status !== 'draft') return;
    await tx.update(sessions).set({ status: 'open', version: s.version + 1 }).where(eq(sessions.id, s.id));
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'session.opened', entityType: 'session', entityId: s.id });
  });
}

export async function cancelSession(account: Account, sessionId: string, reason: string) {
  const emails: Email[] = [];
  await db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    if (s.status === 'cancelled') return;
    if (s.status === 'ended') throw new SessionError('This session has already ended.');
    await tx.update(sessions).set({ status: 'cancelled', cancelledReason: reason || null, version: s.version + 1 }).where(eq(sessions.id, s.id));
    const people = await tx
      .select({ playerId: registrations.playerId })
      .from(registrations)
      .where(and(eq(registrations.sessionId, s.id), sql`${registrations.status} <> 'cancelled'`));
    const payload = { ...payloadOf(s), reason: reason || null };
    for (const p of people) {
      const who = await notifyPlayer(tx, p.playerId, s.clubId, 'session_cancelled', payload);
      emails.push(...emailFor(who?.email, 'session_cancelled', payload));
    }
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'session.cancelled', entityType: 'session', entityId: s.id, reason });
  });
  await flush(emails);
}

/** Copies a session one week later as a draft (no registrations). */
export async function duplicateSession(account: Account, sessionId: string): Promise<string> {
  return db().transaction(async (tx) => {
    const s = await organiserSession(tx, account, sessionId);
    const week = 7 * 86_400_000;
    let shift = week;
    while (s.startsAt.getTime() + shift <= Date.now()) shift += week;
    const closeBefore = s.startsAt.getTime() - s.registrationClosesAt.getTime();
    const startsAt = new Date(s.startsAt.getTime() + shift);
    const courtsUsed = await tx.select({ courtId: sessionCourts.courtId }).from(sessionCourts).where(eq(sessionCourts.sessionId, s.id));
    const [copy] = await tx
      .insert(sessions)
      .values({
        clubId: s.clubId,
        title: s.title,
        venue: s.venue,
        startsAt,
        endsAt: new Date(s.endsAt.getTime() + shift),
        capacity: s.capacity,
        scoring: s.scoring,
        preset: s.preset,
        visibility: s.visibility,
        fees: s.fees,
        registrationOpensAt: new Date(),
        registrationClosesAt: new Date(startsAt.getTime() - closeBefore),
        status: 'draft',
        createdBy: account.id,
      })
      .returning({ id: sessions.id });
    if (courtsUsed.length) await tx.insert(sessionCourts).values(courtsUsed.map((c) => ({ sessionId: copy!.id, clubId: s.clubId, courtId: c.courtId })));
    await audit(tx, { clubId: s.clubId, actorAccountId: account.id, action: 'session.duplicated', entityType: 'session', entityId: copy!.id, before: { from: s.id } });
    return copy!.id;
  });
}
