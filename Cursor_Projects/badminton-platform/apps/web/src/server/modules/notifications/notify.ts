import 'server-only';
import { eq } from 'drizzle-orm';
import type { Tx } from '../../db';
import { accounts, notifications, players } from '../../db/schema';
import type { NotificationPayload } from './text';

/**
 * Creates an in-app notification for the account behind a player: the player's own account,
 * or the parent for a junior. Guests without accounts are skipped. Returns the email address
 * so the caller can also send an email after the transaction commits.
 */
export async function notifyPlayer(
  tx: Tx,
  playerId: string,
  clubId: string,
  type: string,
  payload: NotificationPayload,
): Promise<{ email: string | null } | null> {
  const [p] = await tx
    .select({ accountId: players.accountId, managedBy: players.managedByAccountId, firstName: players.firstName })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  const accountId = p?.accountId ?? p?.managedBy;
  if (!p || !accountId) return null;
  const forChild = !p.accountId;
  await tx.insert(notifications).values({ accountId, playerId, clubId, type, payload: forChild ? { ...payload, playerName: p.firstName } : payload });
  const [a] = await tx.select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)).limit(1);
  return { email: a?.email ?? null };
}

export async function notifyAccount(tx: Tx, accountId: string, clubId: string, type: string, payload: NotificationPayload) {
  await tx.insert(notifications).values({ accountId, clubId, type, payload });
}
