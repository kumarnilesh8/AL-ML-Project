import 'server-only';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '../../db';
import { clubMembers, clubs, courts, players } from '../../db/schema';

/** Clubs the signed-in person belongs to, with their role. */
export async function listMyClubs(accountId: string) {
  return db()
    .select({ id: clubs.id, name: clubs.name, slug: clubs.slug, timeZone: clubs.timeZone, role: clubMembers.role })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .innerJoin(clubs, eq(clubs.id, clubMembers.clubId))
    .where(and(eq(players.accountId, accountId), eq(clubMembers.status, 'active'), isNull(clubs.deletedAt)))
    .orderBy(asc(clubs.name));
}

/**
 * A club page for a member. Non-members get "not found" (we never reveal that a club exists).
 */
export async function getClubForMember(accountId: string, clubId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(clubId)) notFound();
  const membership = await db()
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .where(and(eq(clubMembers.clubId, clubId), eq(players.accountId, accountId), eq(clubMembers.status, 'active')))
    .limit(1);
  if (!membership[0]) notFound();

  const [club] = await db().select().from(clubs).where(and(eq(clubs.id, clubId), isNull(clubs.deletedAt))).limit(1);
  if (!club) notFound();
  const clubCourts = await db()
    .select({ id: courts.id, name: courts.name })
    .from(courts)
    .where(and(eq(courts.clubId, clubId), isNull(courts.archivedAt)))
    .orderBy(asc(courts.sortOrder));
  const [members] = await db()
    .select({ n: count() })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.status, 'active')));
  return { club, courts: clubCourts, memberCount: members?.n ?? 0, myRole: membership[0].role };
}
