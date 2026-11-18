import { tierLabel } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAccount } from '@/server/auth';
import { listMyClubs } from '@/server/modules/clubs/queries';
import { myUpcoming } from '@/server/modules/sessions/queries';
import { formatWhen } from '@bp/domain';
import { getOwnPlayer } from '@/server/modules/players/queries';
import { redirect } from 'next/navigation';
import { safeNext } from '@/server/url';
import { ProfileForm } from './profile-form';

export const metadata: Metadata = { title: 'My page' };

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', organiser: 'Organiser', player: 'Player' } as const;

export default async function MePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const account = await requireAccount();
  const player = await getOwnPlayer(account.id);
  const { next } = await searchParams;
  if (player && next) redirect(safeNext(next));

  if (!player) {
    return (
      <>
        <h1 className="page-title">Welcome</h1>
        <p className="mt-2 max-w-prose text-muted">Set up your player profile. It takes a minute and you can change it later.</p>
        <div className="mt-8">
          <ProfileForm isNew next={next ? safeNext(next) : undefined} />
        </div>
      </>
    );
  }

  const [clubs, upcoming] = await Promise.all([listMyClubs(account.id), myUpcoming(account.id)]);
  return (
    <>
      <h1 className="page-title">Hi, {player.firstName}</h1>
      <p className="mt-1 text-muted">
        {player.displayName} · {player.selfTier ? tierLabel(player.selfTier) : 'Level not set'}
      </p>

      {upcoming.length > 0 && (
        <section className="mt-10" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="font-display text-2xl font-bold">Coming up</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {upcoming.map((u) => (
              <li key={`${u.sessionId}-${u.firstName}`}>
                <Link href={`/clubs/${u.clubId}/sessions/${u.sessionId}`} className="flex flex-wrap items-baseline justify-between gap-2 py-4 hover:text-court">
                  <span>
                    <span className="block font-semibold">{u.title}</span>
                    <span className="text-sm text-muted">{u.clubName} · {formatWhen(u.startsAt, u.timeZone)}</span>
                  </span>
                  <span className="text-sm font-semibold">
                    {u.own ? '' : `${u.firstName}: `}
                    {u.sessionStatus === 'cancelled' ? 'Cancelled' : u.status === 'registered' ? 'Place confirmed' : `Waiting list no. ${u.position}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="clubs-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="clubs-heading" className="font-display text-2xl font-bold">Your clubs</h2>
          <Link href="/clubs/new" className="btn-quiet min-h-10 px-4 text-sm">Create a club</Link>
        </div>
        {clubs.length === 0 ? (
          <p className="mt-4 rounded-lg bg-sunken p-5">
            You are not in a club yet. Open the join link your club shared with you, or create a club if you organise sessions.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {clubs.map((c) => (
              <li key={c.id}>
                <Link href={`/clubs/${c.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-court">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-sm text-muted">{ROLE_LABEL[c.role]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line p-4">
        <div>
          <h2 className="font-semibold">My family</h2>
          <p className="text-sm text-muted">Add children who play with you, and manage them from your account.</p>
        </div>
        <Link href="/me/family" className="btn-quiet min-h-10 px-4 text-sm">Open</Link>
      </section>

      <details className="mt-6 rounded-lg border border-line p-4">
        <summary className="cursor-pointer font-semibold">Edit my profile</summary>
        <div className="mt-6">
          <ProfileForm isNew={false} initial={{ firstName: player.firstName, lastName: player.lastName, tier: player.selfTier }} />
        </div>
      </details>
    </>
  );
}
