import 'server-only';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { players } from '../../db/schema';

/** The signed-in person's own player profile, if they have created one. */
export async function getOwnPlayer(accountId: string) {
  const rows = await db()
    .select()
    .from(players)
    .where(and(eq(players.accountId, accountId), isNull(players.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}
