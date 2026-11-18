import 'server-only';
import { and, asc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getMembership, isUuid } from '../../authz';
import { db } from '../../db';
import { clubMembers, clubs, courts, players, registrations, sessionCourts, sessionInvites, sessions } from '../../db/schema';

const isOrganiserRole = (r: string) => r !== 'player';

/** Player ids the account can act for (own player + children). */
async function myPlayerIds(accountId: string): Promise<string[]> {
  const rows = await db()
    .select({ id: players.id })
    .from(players)
    .where(and(isNull(players.deletedAt), or(eq(players.accountId, accountId), eq(players.managedByAccountId, accountId))));
  return rows.map((r) => r.id);
}

const counts = sql<number>`(select count(*)::int from registrations r where r.session_id = ${sessions.id} and r.status = 'registered')`;
const waitCounts = sql<number>`(select count(*)::int from registrations r where r.session_id = ${sessions.id} and r.status = 'waitlisted')`;

/** Upcoming sessions of a club that this person may see. */
export async function listUpcomingSessions(accountId: string, clubId: string, role: string) {
  const organiser = isOrganiserRole(role);
  const mine = await myPlayerIds(accountId);
  const rows = await db()
    .select({
      id: sessions.id,
      title: sessions.title,
      startsAt: sessions.startsAt,
      endsAt: sessions.endsAt,
      venue: sessions.venue,
      capacity: sessions.capacity,
      status: sessions.status,
      visibility: sessions.visibility,
      registered: counts,
      waitlisted: waitCounts,
    })
    .from(sessions)
    .where(and(eq(sessions.clubId, clubId), gt(sessions.endsAt, sql`now() - interval '2 hours'`)))
    .orderBy(asc(sessions.startsAt))
    .limit(30);
  const invited = mine.length
    ? new Set(
        (await db().select({ s: sessionInvites.sessionId }).from(sessionInvites).where(inArray(sessionInvites.playerId, mine))).map((r) => r.s),
      )
    : new Set<string>();
  return rows.filter((r) => (r.status !== 'draft' || organiser) && (r.visibility === 'club' || organiser || invited.has(r.id)));
}

export interface PersonRow {
  playerId: string;
  name: string;
  status: 'registered' | 'waitlisted';
  position: number | null;
  late: boolean;
  kind: 'member' | 'guest' | 'junior';
}

/** Everything the session page needs, with access checks. */
export async function getSessionView(accountId: string, clubId: string, sessionId: string) {
  if (!isUuid(sessionId)) notFound();
  const me = await getMembership(accountId, clubId);
  if (!me) notFound();
  const organiser = isOrganiserRole(me.role);
  const [row] = await db()
    .select({ s: sessions, club: { name: clubs.name, timeZone: clubs.timeZone, currency: clubs.currency } })
    .from(sessions)
    .innerJoin(clubs, eq(clubs.id, sessions.clubId))
    .where(and(eq(sessions.id, sessionId), eq(sessions.clubId, clubId)))
    .limit(1);
  if (!row) notFound();
  const s = row.s;
  if (s.status === 'draft' && !organiser) notFound();

  const mine = await myPlayerIds(accountId);
  if (s.visibility === 'invited' && !organiser) {
    const inv = mine.length ? await db().select().from(sessionInvites).where(and(eq(sessionInvites.sessionId, s.id), inArray(sessionInvites.playerId, mine))).limit(1) : [];
    if (!inv.length) notFound();
  }

  const courtRows = await db()
    .select({ id: courts.id, name: courts.name })
    .from(sessionCourts)
    .innerJoin(courts, eq(courts.id, sessionCourts.courtId))
    .where(eq(sessionCourts.sessionId, s.id))
    .orderBy(asc(courts.sortOrder));

  const regs = await db()
    .select({
      playerId: registrations.playerId,
      status: registrations.status,
      position: registrations.waitlistPosition,
      late: registrations.lateCancellation,
      registeredAt: registrations.registeredAt,
      firstName: players.firstName,
      lastName: players.lastName,
      ageBand: players.ageBand,
      guest: players.createdByClubId,
    })
    .from(registrations)
    .innerJoin(players, eq(players.id, registrations.playerId))
    .where(and(eq(registrations.sessionId, s.id), sql`${registrations.status} <> 'cancelled'`))
    .orderBy(asc(registrations.registeredAt));
  const people: PersonRow[] = regs.map((r) => {
    const junior = r.ageBand !== 'adult';
    const initial = r.lastName ? ` ${r.lastName[0]!.toUpperCase()}.` : '';
    return {
      playerId: r.playerId,
      name: `${r.firstName}${initial}`,
      status: r.status as 'registered' | 'waitlisted',
      position: r.position,
      late: r.late,
      kind: junior ? 'junior' : r.guest ? 'guest' : 'member',
    };
  });

  // The signed-in person and their children who are members of this club.
  const family = mine.length
    ? await db()
        .select({ playerId: players.id, firstName: players.firstName, own: sql<boolean>`${players.accountId} = ${accountId}` })
        .from(clubMembers)
        .innerJoin(players, eq(players.id, clubMembers.playerId))
        .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.status, 'active'), inArray(players.id, mine)))
    : [];
  const myPeople = family
    .sort((a, b) => Number(b.own) - Number(a.own))
    .map((f) => ({ ...f, registration: people.find((p) => p.playerId === f.playerId) ?? null }));

  return {
    session: s,
    club: row.club,
    myRole: me.role,
    organiser,
    courts: courtRows,
    registered: people.filter((p) => p.status === 'registered'),
    waitlist: people.filter((p) => p.status === 'waitlisted').sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    myPeople,
  };
}

/** Members who could still be given a place (organiser view). */
export async function membersWithoutPlace(clubId: string, sessionId: string) {
  return db()
    .select({ playerId: players.id, firstName: players.firstName, lastName: players.lastName })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .where(
      and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.status, 'active'),
        isNull(players.deletedAt),
        sql`not exists (select 1 from registrations r where r.session_id = ${sessionId} and r.player_id = ${players.id} and r.status <> 'cancelled')`,
      ),
    )
    .orderBy(asc(players.firstName));
}

/** The signed-in person's (and children's) upcoming places and waiting-list spots, across clubs. */
export async function myUpcoming(accountId: string) {
  const mine = await myPlayerIds(accountId);
  if (!mine.length) return [];
  return db()
    .select({
      sessionId: sessions.id,
      clubId: clubs.id,
      clubName: clubs.name,
      timeZone: clubs.timeZone,
      title: sessions.title,
      startsAt: sessions.startsAt,
      endsAt: sessions.endsAt,
      sessionStatus: sessions.status,
      status: registrations.status,
      position: registrations.waitlistPosition,
      firstName: players.firstName,
      own: sql<boolean>`${players.accountId} = ${accountId}`,
    })
    .from(registrations)
    .innerJoin(sessions, eq(sessions.id, registrations.sessionId))
    .innerJoin(clubs, eq(clubs.id, sessions.clubId))
    .innerJoin(players, eq(players.id, registrations.playerId))
    .where(and(inArray(registrations.playerId, mine), sql`${registrations.status} <> 'cancelled'`, gt(sessions.endsAt, sql`now()`)))
    .orderBy(asc(sessions.startsAt))
    .limit(20);
}
