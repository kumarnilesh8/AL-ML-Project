import 'server-only';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { clubMembers, clubs, players } from '../../db/schema';

export async function listChildren(accountId: string) {
  const kids = await db()
    .select({ id: players.id, firstName: players.firstName, lastName: players.lastName, ageBand: players.ageBand, tier: players.selfTier })
    .from(players)
    .where(and(eq(players.managedByAccountId, accountId), isNull(players.deletedAt)))
    .orderBy(asc(players.firstName));
  const memberships = await db()
    .select({ playerId: clubMembers.playerId, clubId: clubs.id, clubName: clubs.name })
    .from(clubMembers)
    .innerJoin(players, eq(players.id, clubMembers.playerId))
    .innerJoin(clubs, eq(clubs.id, clubMembers.clubId))
    .where(and(eq(players.managedByAccountId, accountId), eq(clubMembers.status, 'active')));
  return kids.map((k) => ({ ...k, clubs: memberships.filter((m) => m.playerId === k.id).map((m) => ({ id: m.clubId, name: m.clubName })) }));
}
