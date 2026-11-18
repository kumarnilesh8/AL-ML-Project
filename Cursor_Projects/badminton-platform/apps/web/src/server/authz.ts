import 'server-only';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from './db';
import { clubMembers, players } from './db/schema';

export type ClubRole = 'owner' | 'admin' | 'organiser' | 'player';

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to do that.') {
    super(message);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

/** The signed-in person's own active membership in a club, or null. */
export async function getMembership(accountId: string, clubId: string) {
  if (!isUuid(clubId)) return null;
  const rows = await db()
    .select({ role: clubMembers.role, status: clubMembers.status, playerId: clubMembers.playerId })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .where(and(eq(clubMembers.clubId, clubId), eq(players.accountId, accountId), eq(clubMembers.status, 'active')))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Page guard: non-members get "not found" (a club's existence is never revealed).
 * Members without one of `roles` get ForbiddenError.
 */
export async function requireClubRole(accountId: string, clubId: string, roles?: ClubRole[]) {
  const m = await getMembership(accountId, clubId);
  if (!m) notFound();
  if (roles && !roles.includes(m.role)) throw new ForbiddenError();
  return m;
}

export const MANAGERS: ClubRole[] = ['owner', 'admin'];
export const ORGANISERS: ClubRole[] = ['owner', 'admin', 'organiser'];
