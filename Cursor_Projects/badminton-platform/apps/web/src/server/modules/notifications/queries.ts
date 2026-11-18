import 'server-only';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../db';
import { clubs, notifications } from '../../db/schema';

export async function unreadCount(accountId: string): Promise<number> {
  const [r] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.accountId, accountId), isNull(notifications.readAt)));
  return r?.n ?? 0;
}

export async function listNotifications(accountId: string, limit = 50) {
  return db()
    .select({ id: notifications.id, type: notifications.type, payload: notifications.payload, readAt: notifications.readAt, createdAt: notifications.createdAt, clubId: notifications.clubId, clubName: clubs.name })
    .from(notifications)
    .leftJoin(clubs, eq(clubs.id, notifications.clubId))
    .where(eq(notifications.accountId, accountId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAllRead(accountId: string) {
  await db().update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.accountId, accountId), isNull(notifications.readAt)));
}
