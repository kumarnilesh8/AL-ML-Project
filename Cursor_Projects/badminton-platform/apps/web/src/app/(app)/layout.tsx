import Link from 'next/link';
import { requireAccount } from '@/server/auth';
import { unreadCount } from '@/server/modules/notifications/queries';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  const unread = await unreadCount(account.id);
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/me" className="font-display text-xl font-bold">
            Club sessions
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/notifications" className="btn-quiet min-h-10 px-3 text-sm" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
              Updates{unread > 0 && <span className="ml-2 rounded-full bg-court px-2 text-xs font-bold text-on-court">{unread}</span>}
            </Link>
          <form action="/auth/sign-out" method="post" className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted sm:inline" title={account.email}>
              {account.email}
            </span>
            <button type="submit" className="btn-quiet min-h-10 px-3 text-sm">
              Sign out
            </button>
          </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
