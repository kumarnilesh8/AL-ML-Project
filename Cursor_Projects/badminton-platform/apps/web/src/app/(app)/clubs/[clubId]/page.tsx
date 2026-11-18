import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { ShareLink } from '@/components/share-link';
import { requireAccount } from '@/server/auth';
import { getClubForMember } from '@/server/modules/clubs/queries';
import { listChildren } from '@/server/modules/family/queries';
import { countPending } from '@/server/modules/members/queries';
import { listUpcomingSessions } from '@/server/modules/sessions/queries';
import { formatSessionRange, zoneLabel } from '@bp/domain';
import { canManageMembers } from '@/server/modules/members/rules';
import { baseUrl } from '@/server/url';
import { addChildAction, resetLinkAction } from './actions';

export const metadata: Metadata = { title: 'Club' };

const ROLE_LABEL = { owner: 'the owner', admin: 'an admin', organiser: 'an organiser', player: 'a player' } as const;

export default async function ClubPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const account = await requireAccount();
  const { club, courts, memberCount, myRole } = await getClubForMember(account.id, clubId);
  const manager = canManageMembers(myRole);
  const [pending, children, origin] = await Promise.all([manager ? countPending(clubId) : 0, listChildren(account.id), baseUrl()]);
  const upcoming = await listUpcomingSessions(account.id, clubId, myRole);
  const organiser = myRole !== 'player';
  const childrenNotInClub = club.juniorsAllowed ? children.filter((c) => !c.clubs.some((x) => x.id === clubId)) : [];

  return (
    <>
      <Link href="/me" className="text-sm font-semibold text-court underline-offset-4 hover:underline">My page</Link>
      <h1 className="page-title mt-2">{club.name}</h1>
      <p className="mt-1 text-muted">
        You are {ROLE_LABEL[myRole]}. Times shown in {club.timeZone}.
      </p>

      {pending > 0 && (
        <Link href={`/clubs/${clubId}/members?filter=pending`} className="mt-6 block rounded-lg border-2 border-court p-4 font-semibold">
          {pending} {pending === 1 ? 'person wants' : 'people want'} to join. Review requests
        </Link>
      )}

      <section className="mt-8" aria-labelledby="sessions-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="sessions-heading" className="font-display text-2xl font-bold">Sessions</h2>
          {organiser && <Link href={`/clubs/${clubId}/sessions/new`} className="btn-primary min-h-10 px-4 text-sm">New session</Link>}
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 rounded-lg bg-sunken p-5">{organiser ? 'No sessions planned. Create one so members can register.' : 'No sessions planned yet.'}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {upcoming.map((u) => (
              <li key={u.id}>
                <Link href={`/clubs/${clubId}/sessions/${u.id}`} className="flex flex-wrap items-baseline justify-between gap-2 py-4 hover:text-court">
                  <span>
                    <span className="block font-semibold">{u.title}{u.status === 'draft' && <span className="font-normal text-muted"> (draft)</span>}{u.status === 'cancelled' && <span className="font-normal text-danger"> (cancelled)</span>}</span>
                    <span className="text-sm text-muted">{formatSessionRange(u.startsAt, u.endsAt, club.timeZone)} {zoneLabel(club.timeZone)}</span>
                  </span>
                  <span className="text-sm text-muted">
                    {u.registered >= u.capacity ? `Full${u.waitlisted ? `, ${u.waitlisted} waiting` : ''}` : `${u.capacity - u.registered} places left`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-lg bg-sunken p-5" aria-labelledby="invite-heading">
        <h2 id="invite-heading" className="font-display text-2xl font-bold">Invite players</h2>
        <p className="mt-1 text-muted">
          {club.joinPolicy === 'open'
            ? 'Anyone with this link can join the club. Share it in your club’s WhatsApp group.'
            : 'People with this link can ask to join; an owner or admin approves them.'}
        </p>
        <div className="mt-4">
          <ShareLink url={`${origin}/join/${club.joinCode}`} title={club.name} />
        </div>
        {manager && (
          <ActionForm action={resetLinkAction} hidden={{ clubId }} confirm="Create a new link? The current link will stop working." className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="text-sm font-semibold text-muted underline underline-offset-4">Create a new link</button>
          </ActionForm>
        )}
      </section>

      <section className="mt-8" aria-labelledby="members-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="members-heading" className="font-display text-2xl font-bold">Members</h2>
          <Link href={`/clubs/${clubId}/members`} className="btn-quiet min-h-10 px-4 text-sm">See all {memberCount}</Link>
        </div>
      </section>

      {childrenNotInClub.length > 0 && (
        <section className="mt-8" aria-labelledby="family-heading">
          <h2 id="family-heading" className="font-display text-2xl font-bold">Your family</h2>
          <ul className="mt-3 space-y-2">
            {childrenNotInClub.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
                <span className="font-semibold">{c.firstName}</span>
                <ActionForm action={addChildAction} hidden={{ clubId, childId: c.id }} className="flex flex-wrap items-center gap-2">
                  <button type="submit" className="btn-quiet min-h-10 px-4 text-sm">Add {c.firstName} to this club</button>
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="courts-heading">
        <h2 id="courts-heading" className="font-display text-2xl font-bold">Courts</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {courts.map((c) => (
            <li key={c.id} className="rounded-lg bg-court px-4 py-5 text-center font-display text-xl font-bold text-on-court">{c.name}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
