import 'server-only';
import { and, asc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { accounts, clubMembers, clubs, players } from '../../db/schema';
import { hashToken } from './tokens';
import { canSeeEmails, type Role } from './rules';

export type MemberFilter = 'all' | 'organisers' | 'guests' | 'juniors' | 'pending';

export interface MemberRow {
  playerId: string;
  name: string;
  role: Role;
  status: 'active' | 'pending' | 'removed';
  tier: string | null;
  ageBand: 'adult' | '14_17' | 'under_14';
  kind: 'member' | 'guest' | 'junior';
  email: string | null;
  isMe: boolean;
}

/** Members of a club as seen by `viewer`. Juniors show first name and initial; emails only for owners/admins. */
export async function listMembers(clubId: string, viewer: { accountId: string; role: Role }, opts: { q?: string; filter?: MemberFilter } = {}): Promise<MemberRow[]> {
  const filter = opts.filter ?? 'all';
  const conditions = [eq(clubMembers.clubId, clubId), isNull(players.deletedAt)];
  conditions.push(filter === 'pending' ? eq(clubMembers.status, 'pending') : eq(clubMembers.status, 'active'));
  if (filter === 'organisers') conditions.push(sql`${clubMembers.role} in ('owner','admin','organiser')`);
  if (filter === 'guests') conditions.push(sql`${players.createdByClubId} is not null`);
  if (filter === 'juniors') conditions.push(sql`${players.ageBand} <> 'adult'`);
  const q = opts.q?.trim();
  if (q) conditions.push(or(ilike(players.firstName, `%${q}%`), ilike(players.lastName, `%${q}%`), ilike(players.displayName, `%${q}%`))!);

  const rows = await db()
    .select({
      playerId: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      displayName: players.displayName,
      ageBand: players.ageBand,
      tier: players.selfTier,
      accountId: players.accountId,
      createdByClubId: players.createdByClubId,
      email: accounts.email,
      role: clubMembers.role,
      status: clubMembers.status,
    })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .leftJoin(accounts, eq(accounts.id, players.accountId))
    .where(and(...conditions))
    .orderBy(sql`case ${clubMembers.role} when 'owner' then 0 when 'admin' then 1 when 'organiser' then 2 else 3 end`, asc(players.firstName))
    .limit(500);

  const showEmails = canSeeEmails(viewer.role);
  return rows.map((r) => {
    const junior = r.ageBand !== 'adult';
    return {
      playerId: r.playerId,
      name: junior ? `${r.firstName}${r.lastName ? ` ${r.lastName[0]!.toUpperCase()}.` : ''}` : [r.firstName, r.lastName].filter(Boolean).join(' '),
      role: r.role,
      status: r.status,
      tier: r.tier,
      ageBand: r.ageBand,
      kind: junior ? 'junior' : r.createdByClubId ? 'guest' : 'member',
      email: showEmails && !junior ? r.email : null,
      isMe: r.accountId === viewer.accountId,
    };
  });
}

export async function countPending(clubId: string): Promise<number> {
  const [r] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.status, 'pending')));
  return r?.n ?? 0;
}

export async function getClubByJoinCode(code: string) {
  if (!/^[a-z0-9]{8,16}$/.test(code)) return null;
  const [c] = await db()
    .select({ id: clubs.id, name: clubs.name, joinPolicy: clubs.joinPolicy })
    .from(clubs)
    .where(and(eq(clubs.joinCode, code), isNull(clubs.deletedAt)))
    .limit(1);
  return c ?? null;
}

export async function getInviteSummary(token: string) {
  const rows = await db().execute<{ club_name: string; email: string; expired: boolean; used: boolean }>(sql`
    select c.name as club_name, i.email, i.expires_at < now() as expired, (i.accepted_at is not null or i.revoked_at is not null) as used
    from club_invites i join clubs c on c.id = i.club_id
    where i.token_hash = ${hashToken(token)} limit 1`);
  return rows[0] ?? null;
}
