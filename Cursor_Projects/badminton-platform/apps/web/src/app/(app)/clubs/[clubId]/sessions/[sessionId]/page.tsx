import { formatMoney, formatSessionRange, zoneLabel } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { LocalTime } from '@/components/local-time';
import { requireAccount } from '@/server/auth';
import { getSessionView } from '@/server/modules/sessions/queries';
import { registrationWindow } from '@/server/modules/sessions/rules';
import { cancelRegistrationAction, registerAction } from '../actions';

export const metadata: Metadata = { title: 'Session' };

const WINDOW_TEXT: Record<string, string> = {
  draft: 'Draft: only organisers can see this session.',
  not_open: 'Registration has not opened yet.',
  closed: 'Registration has closed. Contact an organiser for changes.',
  started: 'This session is under way.',
  ended: 'This session has ended.',
  cancelled: 'This session was cancelled.',
};

export default async function SessionPage({ params }: { params: Promise<{ clubId: string; sessionId: string }> }) {
  const { clubId, sessionId } = await params;
  const account = await requireAccount();
  const v = await getSessionView(account.id, clubId, sessionId);
  const s = v.session;
  const tz = v.club.timeZone;
  const window = registrationWindow(s);
  const placesLeft = Math.max(0, s.capacity - v.registered.length);

  return (
    <>
      <Link href={`/clubs/${clubId}`} className="text-sm font-semibold text-court underline-offset-4 hover:underline">{v.club.name}</Link>
      <h1 className="page-title mt-2">{s.title}</h1>
      <p className="mt-2 text-lg">
        {formatSessionRange(s.startsAt, s.endsAt, tz)} <span className="text-muted">{zoneLabel(tz)}</span>
        <LocalTime iso={s.startsAt.toISOString()} clubTimeZone={tz} />
      </p>
      {s.venue && <p className="text-muted">{s.venue}</p>}
      {s.status === 'cancelled' && (
        <p className="mt-4 rounded-lg border-2 border-danger p-4 font-semibold text-danger">Cancelled{s.cancelledReason ? `: ${s.cancelledReason}` : ''}</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Places left', `${placesLeft} of ${s.capacity}`],
          ['Waiting list', String(v.waitlist.length)],
          ['Courts', v.courts.map((c) => c.name).join(', ') || '—'],
          ['Fee', `${formatMoney(s.fees.member, v.club.currency)} members`],
        ].map(([k, val]) => (
          <div key={k} className="rounded-lg bg-sunken p-3">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-semibold">{val}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-muted">
        Guests {formatMoney(s.fees.guest, v.club.currency)} · Juniors {formatMoney(s.fees.junior, v.club.currency)} · One game per match, to {s.scoring.pointsToWin}
        {s.scoring.winByTwo ? `, win by 2, maximum ${s.scoring.cap}` : ''}.
      </p>

      {v.organiser && (
        <Link href={`/clubs/${clubId}/sessions/${sessionId}/manage`} className="btn-quiet mt-6">Manage registrations</Link>
      )}

      <section className="mt-8" aria-labelledby="you-heading">
        <h2 id="you-heading" className="font-display text-2xl font-bold">Your registration</h2>
        {window !== 'open' && <p className="mt-2 text-muted">{WINDOW_TEXT[window]}</p>}
        <ul className="mt-3 space-y-2">
          {v.myPeople.map((p) => {
            const r = p.registration;
            return (
              <li key={p.playerId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4">
                <div>
                  <p className="font-semibold">{p.own ? 'You' : p.firstName}</p>
                  <p className="text-sm text-muted">
                    {!r ? 'Not registered' : r.status === 'registered' ? 'You have a place' : `Waiting list: number ${r.position}`}
                  </p>
                </div>
                {window === 'open' && !r && (
                  <ActionForm action={registerAction} hidden={{ clubId, sessionId, playerId: p.playerId }} className="flex flex-col items-end">
                    <button type="submit" className="btn-primary min-h-11">{placesLeft > 0 ? 'Register' : 'Join waiting list'}</button>
                  </ActionForm>
                )}
                {r && window !== 'started' && window !== 'ended' && window !== 'cancelled' && (
                  <ActionForm action={cancelRegistrationAction} hidden={{ clubId, sessionId, playerId: p.playerId }} confirm="Cancel this registration? Your place goes to the next person waiting." className="flex flex-col items-end">
                    <button type="submit" className="btn-quiet min-h-11">Cancel</button>
                  </ActionForm>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="who-heading">
        <h2 id="who-heading" className="font-display text-2xl font-bold">Who is coming ({v.registered.length})</h2>
        {v.registered.length === 0 ? (
          <p className="mt-2 text-muted">Nobody yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {v.registered.map((p) => (
              <li key={p.playerId} className="rounded-full bg-sunken px-3 py-1">{p.name}{p.kind === 'guest' && <span className="text-muted"> (guest)</span>}</li>
            ))}
          </ul>
        )}
        {v.waitlist.length > 0 && (
          <>
            <h3 className="mt-6 font-semibold">Waiting list</h3>
            <ol className="mt-2 list-inside list-decimal text-muted">
              {v.waitlist.map((p) => <li key={p.playerId}>{p.name}</li>)}
            </ol>
          </>
        )}
      </section>
    </>
  );
}
