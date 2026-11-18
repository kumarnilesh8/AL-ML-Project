import type { Metadata } from 'next';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { requireAccount } from '@/server/auth';
import { listNotifications, markAllRead } from '@/server/modules/notifications/queries';
import { notificationText } from '@/server/modules/notifications/text';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const account = await requireAccount();
  const items = await listNotifications(account.id);
  const unread = items.filter((n) => !n.readAt).length;
  async function readAll() {
    'use server';
    const a = await requireAccount();
    await markAllRead(a.id);
    revalidatePath('/', 'layout');
  }
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title">Notifications</h1>
        {unread > 0 && (
          <form action={readAll}>
            <button type="submit" className="btn-quiet min-h-10 px-4 text-sm">Mark all as read</button>
          </form>
        )}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 rounded-lg bg-sunken p-5">Nothing yet. Registration updates and session changes appear here.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {items.map((n) => {
            const sessionId = typeof n.payload.sessionId === 'string' ? n.payload.sessionId : null;
            const text = notificationText(n.type, n.payload);
            return (
              <li key={n.id} className={`py-4 ${n.readAt ? '' : 'border-l-4 border-court pl-3'}`}>
                {sessionId && n.clubId ? (
                  <Link href={`/clubs/${n.clubId}/sessions/${sessionId}`} className="hover:text-court">{text}</Link>
                ) : (
                  <p>{text}</p>
                )}
                <p className="text-sm text-muted">
                  {n.clubName ? `${n.clubName} · ` : ''}
                  {n.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  {!n.readAt && <span className="sr-only"> (unread)</span>}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
