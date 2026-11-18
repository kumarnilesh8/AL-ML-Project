import 'server-only';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import type { Account } from '../../auth';
import { audit } from '../../audit';
import { ForbiddenError, isUuid } from '../../authz';
import { db, type Tx } from '../../db';
import { accounts, clubInvites, clubMembers, clubs, players } from '../../db/schema';
import { sendEmail } from '../../email';
import { canAddGuests, canChangeRole, canManageMembers, canRemove, type Role } from './rules';
import { hashToken, newInviteToken, newJoinCode } from './tokens';
import { INVITE_DAYS, JOIN_CODE, type GuestInput } from './validation';

export class MemberError extends Error {}

async function ownPlayerId(tx: Tx, accountId: string): Promise<string | null> {
  const [p] = await tx
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.accountId, accountId), isNull(players.deletedAt)))
    .limit(1);
  return p?.id ?? null;
}

async function actorRole(tx: Tx, accountId: string, clubId: string): Promise<{ role: Role; playerId: string } | null> {
  const [m] = await tx
    .select({ role: clubMembers.role, playerId: clubMembers.playerId })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .where(and(eq(clubMembers.clubId, clubId), eq(players.accountId, accountId), eq(clubMembers.status, 'active')))
    .limit(1);
  return m ?? null;
}

export async function requireActor(tx: Tx, accountId: string, clubId: string, allowed: (r: Role) => boolean) {
  const me = isUuid(clubId) ? await actorRole(tx, accountId, clubId) : null;
  if (!me || !allowed(me.role)) throw new ForbiddenError();
  return me;
}

async function membershipOf(tx: Tx, clubId: string, playerId: string) {
  const [m] = await tx
    .select()
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.playerId, playerId)))
    .limit(1);
  return m ?? null;
}

/** Join through the club's link. Open clubs: active at once; approval clubs: a pending request. */
export async function joinByCode(account: Account, code: string): Promise<{ clubId: string; status: 'active' | 'pending' }> {
  if (!JOIN_CODE.test(code)) throw new MemberError('This join link is not valid.');
  return db().transaction(async (tx) => {
    const [club] = await tx.select().from(clubs).where(and(eq(clubs.joinCode, code), isNull(clubs.deletedAt))).limit(1);
    if (!club) throw new MemberError('This join link is not valid any more. Ask the club for a new one.');
    const playerId = await ownPlayerId(tx, account.id);
    if (!playerId) throw new MemberError('Create your player profile first.');

    const existing = await membershipOf(tx, club.id, playerId);
    if (existing && existing.status !== 'removed') return { clubId: club.id, status: existing.status as 'active' | 'pending' };

    const status: 'active' | 'pending' = club.joinPolicy === 'open' ? 'active' : 'pending';
    const values = { status, role: 'player' as const, joinedAt: new Date(), requestedAt: new Date(), removedAt: null, decidedBy: null };
    if (existing) {
      await tx.update(clubMembers).set(values).where(and(eq(clubMembers.clubId, club.id), eq(clubMembers.playerId, playerId)));
    } else {
      await tx.insert(clubMembers).values({ clubId: club.id, playerId, ...values });
    }
    await audit(tx, {
      clubId: club.id,
      actorAccountId: account.id,
      action: status === 'active' ? 'member.joined_by_link' : 'member.requested',
      entityType: 'player',
      entityId: playerId,
    });
    return { clubId: club.id, status };
  });
}

/** Owners and admins approve or decline join requests. */
export async function decideRequest(account: Account, clubId: string, playerId: string, approve: boolean) {
  return db().transaction(async (tx) => {
    await requireActor(tx, account.id, clubId, canManageMembers);
    const m = await membershipOf(tx, clubId, playerId);
    if (!m || m.status !== 'pending') throw new MemberError('This request has already been handled.');
    await tx
      .update(clubMembers)
      .set(approve ? { status: 'active', joinedAt: new Date(), decidedBy: account.id } : { status: 'removed', removedAt: new Date(), decidedBy: account.id })
      .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.playerId, playerId)));
    await audit(tx, { clubId, actorAccountId: account.id, action: approve ? 'member.approved' : 'member.declined', entityType: 'player', entityId: playerId });
  });
}

export async function setRole(account: Account, clubId: string, playerId: string, newRole: Role) {
  return db().transaction(async (tx) => {
    const me = await requireActor(tx, account.id, clubId, () => true);
    const m = await membershipOf(tx, clubId, playerId);
    if (!m || m.status !== 'active') throw new MemberError('This person is not an active member.');
    if (m.role === newRole) return 'unchanged' as const;
    if (!canChangeRole(me.role, m.role, newRole, me.playerId === playerId)) throw new ForbiddenError();
    await tx.update(clubMembers).set({ role: newRole }).where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.playerId, playerId)));
    await audit(tx, { clubId, actorAccountId: account.id, action: 'member.role_changed', entityType: 'player', entityId: playerId, before: { role: m.role }, after: { role: newRole } });
    return 'changed' as const;
  });
}

/** Removes a member (or lets a member leave). History and results are kept. */
export async function removeMember(account: Account, clubId: string, playerId: string) {
  return db().transaction(async (tx) => {
    const me = await requireActor(tx, account.id, clubId, () => true);
    const m = await membershipOf(tx, clubId, playerId);
    if (!m || m.status === 'removed') throw new MemberError('This person is not a member.');
    if (!canRemove(me.role, m.role, me.playerId === playerId)) throw new ForbiddenError();
    await tx
      .update(clubMembers)
      .set({ status: 'removed', removedAt: new Date(), decidedBy: account.id })
      .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.playerId, playerId)));
    await audit(tx, { clubId, actorAccountId: account.id, action: me.playerId === playerId ? 'member.left' : 'member.removed', entityType: 'player', entityId: playerId, before: { role: m.role } });
  });
}

/** Organisers add a guest player (no account) for this club. */
export async function addGuest(account: Account, clubId: string, input: GuestInput) {
  return db().transaction(async (tx) => {
    await requireActor(tx, account.id, clubId, canAddGuests);
    const initial = input.lastName ? ` ${input.lastName[0]!.toUpperCase()}.` : '';
    const [guest] = await tx
      .insert(players)
      .values({ firstName: input.firstName, lastName: input.lastName, displayName: `${input.firstName}${initial}`, selfTier: input.tier, createdByClubId: clubId })
      .returning({ id: players.id });
    await tx.insert(clubMembers).values({ clubId, playerId: guest!.id, role: 'player' });
    await audit(tx, { clubId, actorAccountId: account.id, action: 'member.guest_added', entityType: 'player', entityId: guest!.id, after: { name: input.firstName, tier: input.tier } });
    return guest!.id;
  });
}

/** New join code: the old link stops working immediately. */
export async function resetJoinLink(account: Account, clubId: string) {
  return db().transaction(async (tx) => {
    await requireActor(tx, account.id, clubId, canManageMembers);
    const code = newJoinCode();
    await tx.update(clubs).set({ joinCode: code }).where(eq(clubs.id, clubId));
    await audit(tx, { clubId, actorAccountId: account.id, action: 'club.join_link_reset', entityType: 'club', entityId: clubId });
    return code;
  });
}

/**
 * Personal email invitations (valid 14 days). Existing members and anyone invited in the
 * last 24 hours are skipped. Returns what happened to each address.
 */
export async function inviteByEmail(account: Account, clubId: string, emails: string[], baseUrl: string) {
  const outcome = { sent: [] as string[], alreadyMember: [] as string[], recentlyInvited: [] as string[] };
  const toSend: { email: string; token: string }[] = [];
  const clubName = await db().transaction(async (tx) => {
    await requireActor(tx, account.id, clubId, canManageMembers);
    const [club] = await tx.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, clubId)).limit(1);
    for (const email of emails) {
      const member = await tx
        .select({ id: players.id })
        .from(clubMembers)
        .innerJoin(players, eq(players.id, clubMembers.playerId))
        .innerJoin(accounts, eq(accounts.id, players.accountId))
        .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.status, 'active'), sql`${accounts.email} = ${email}::citext`))
        .limit(1);
      if (member[0]) {
        outcome.alreadyMember.push(email);
        continue;
      }
      const recent = await tx
        .select({ id: clubInvites.id })
        .from(clubInvites)
        .where(and(eq(clubInvites.clubId, clubId), sql`${clubInvites.email} = ${email}::citext`, gt(clubInvites.createdAt, sql`now() - interval '24 hours'`), isNull(clubInvites.acceptedAt), isNull(clubInvites.revokedAt)))
        .limit(1);
      if (recent[0]) {
        outcome.recentlyInvited.push(email);
        continue;
      }
      const { token, hash } = newInviteToken();
      await tx.insert(clubInvites).values({ clubId, email, tokenHash: hash, expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000), createdBy: account.id });
      toSend.push({ email, token });
    }
    if (toSend.length) await audit(tx, { clubId, actorAccountId: account.id, action: 'member.invited', entityType: 'club', entityId: clubId, after: { count: toSend.length } });
    return club!.name;
  });
  for (const { email, token } of toSend) {
    await sendEmail({
      to: email,
      subject: `You're invited to join ${clubName}`,
      text: `You have been invited to join ${clubName} for badminton sessions.\n\nOpen this link to join (valid for ${INVITE_DAYS} days):\n${baseUrl}/invite/${token}\n\nIf you were not expecting this, you can ignore this email.`,
    });
    outcome.sent.push(email);
  }
  return outcome;
}

/** Accepts a personal invitation. The signed-in email must match the invited email. */
export async function acceptInvite(account: Account, token: string): Promise<{ clubId: string }> {
  return db().transaction(async (tx) => {
    const [invite] = await tx.select().from(clubInvites).where(eq(clubInvites.tokenHash, hashToken(token))).limit(1);
    if (!invite || invite.revokedAt) throw new MemberError('This invitation is not valid. Ask the club to send a new one.');
    if (invite.acceptedAt) {
      if (invite.acceptedBy === account.id) return { clubId: invite.clubId };
      throw new MemberError('This invitation has already been used.');
    }
    if (invite.expiresAt.getTime() < Date.now()) throw new MemberError('This invitation has expired. Ask the club to send a new one.');
    if (invite.email.toLowerCase() !== account.email.toLowerCase()) {
      throw new MemberError(`This invitation was sent to ${invite.email}. Sign in with that email address to accept it.`);
    }
    const playerId = await ownPlayerId(tx, account.id);
    if (!playerId) throw new MemberError('Create your player profile first.');
    const existing = await membershipOf(tx, invite.clubId, playerId);
    if (!existing) {
      await tx.insert(clubMembers).values({ clubId: invite.clubId, playerId, role: 'player', status: 'active' });
    } else if (existing.status !== 'active') {
      await tx.update(clubMembers).set({ status: 'active', role: 'player', joinedAt: new Date(), removedAt: null }).where(and(eq(clubMembers.clubId, invite.clubId), eq(clubMembers.playerId, playerId)));
    }
    await tx.update(clubInvites).set({ acceptedAt: new Date(), acceptedBy: account.id }).where(eq(clubInvites.id, invite.id));
    await audit(tx, { clubId: invite.clubId, actorAccountId: account.id, action: 'member.invite_accepted', entityType: 'player', entityId: playerId });
    return { clubId: invite.clubId };
  });
}

/** A parent who is an active member adds their child to the club (if the club accepts juniors). */
export async function addChildToClub(account: Account, clubId: string, childId: string) {
  return db().transaction(async (tx) => {
    await requireActor(tx, account.id, clubId, () => true);
    const [child] = await tx
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.id, childId), eq(players.managedByAccountId, account.id), isNull(players.deletedAt)))
      .limit(1);
    if (!child) throw new ForbiddenError();
    const [club] = await tx.select({ juniorsAllowed: clubs.juniorsAllowed }).from(clubs).where(eq(clubs.id, clubId)).limit(1);
    if (!club?.juniorsAllowed) throw new MemberError('This club does not accept junior players.');
    const existing = await membershipOf(tx, clubId, childId);
    if (existing?.status === 'active') return;
    if (existing) {
      await tx.update(clubMembers).set({ status: 'active', role: 'player', joinedAt: new Date(), removedAt: null }).where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.playerId, childId)));
    } else {
      await tx.insert(clubMembers).values({ clubId, playerId: childId, role: 'player' });
    }
    await audit(tx, { clubId, actorAccountId: account.id, action: 'member.child_added', entityType: 'player', entityId: childId });
  });
}
