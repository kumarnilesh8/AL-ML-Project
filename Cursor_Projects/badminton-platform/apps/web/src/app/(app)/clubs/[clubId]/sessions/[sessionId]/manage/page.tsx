import { formatSessionRange, zoneLabel } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { requireAccount } from '@/server/auth';
import { ORGANISERS, requireClubRole } from '@/server/authz';
import { getSessionView, membersWithoutPlace } from '@/server/modules/sessions/queries';
import { registrationWindow } from '@/server/modules/sessions/rules';
import {
  cancelSessionAction,
  duplicateSessionAction,
  moveInWaitlistAction,
  moveToWaitlistAction,
  openSessionAction,
  organiserAddAction,
  organiserRemoveAction,
} from '../../actions';

export const metadata: Metadata = { title: 'Manage session' };

export default async function ManageSessionPage({ params }: { params: Promise<{ clubId: string; sessionId: string }> }) {
  const { clubId, sessionId } = await params;
  const account = await requireAccount();
  await requireClubRole(account.id, clubId, ORGANISERS);
  const v = await getSessionView(account.id, clubId, sessionId);
  const s = v.session;
  const window = registrationWindow(s);
  const editable = window !== 'started' && window !== 'ended' && window !== 'cancelled';
  const others = editable ? await membersWithoutPlace(clubId, sessionId) : [];
  const h = { clubId, sessionId };

  return (
    <>
      <Link href={`/clubs/${clubId}/sessions/${sessionId}`} className="text-sm font-semibold text-court underline-offset-4 hover:underline">Player view</Link>
      <h1 className="page-title mt-2">{s.title}</h1>
      <p className="mt-1 text-muted">
        {formatSessionRange(s.startsAt, s.endsAt, v.club.timeZone)} {zoneLabel(v.club.timeZone)} · {v.registered.length} of {s.capacity} places · {v.waitlist.length} waiting
      </p>
      {v.registered.length > s.capacity && <p className="mt-2 font-semibold text-cork">Over capacity by {v.registered.length - s.capacity}.</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {s.status === 'draft' && (
          <ActionForm action={openSessionAction} hidden={h}>
            <button type="submit" className="btn-primary min-h-11">Open registration</button>
          </ActionForm>
        )}
        {editable && <Link href={`/clubs/${clubId}/sessions/${sessionId}/edit`} className="btn-quiet min-h-11">Edit details</Link>}
        <ActionForm action={duplicateSessionAction} hidden={h}>
          <button type="submit" className="btn-quiet min-h-11">Copy to next week</button>
        </ActionForm>
      </div>

      <section className="mt-8" aria-labelledby="reg-heading">
        <h2 id="reg-heading" className="font-display text-2xl font-bold">Registered ({v.registered.length})</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {v.registered.map((p) => (
            <li key={p.playerId} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>
                {p.name}
                {p.kind !== 'member' && <span className="text-muted"> ({p.kind})</span>}
              </span>
              {editable && (
                <span className="flex flex-wrap gap-2">
                  <ActionForm action={moveToWaitlistAction} hidden={{ ...h, playerId: p.playerId }}>
                    <button type="submit" className="btn-quiet min-h-10 px-3 text-sm">To waiting list</button>
                  </ActionForm>
                  <ActionForm action={organiserRemoveAction} hidden={{ ...h, playerId: p.playerId }} confirm={`Remove ${p.name} from this session?`}>
                    <button type="submit" className="btn-quiet min-h-10 px-3 text-sm text-danger">Remove</button>
                  </ActionForm>
                </span>
              )}
            </li>
          ))}
          {v.registered.length === 0 && <li className="py-3 text-muted">Nobody yet.</li>}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="wait-heading">
        <h2 id="wait-heading" className="font-display text-2xl font-bold">Waiting list ({v.waitlist.length})</h2>
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {v.waitlist.map((p, i) => (
            <li key={p.playerId} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span><span className="font-semibold">{p.position}.</span> {p.name}</span>
              {editable && (
                <span className="flex flex-wrap gap-2">
                  <ActionForm action={moveInWaitlistAction} hidden={{ ...h, playerId: p.playerId, direction: 'up' }}>
                    <button type="submit" className="btn-quiet min-h-10 px-3 text-sm" disabled={i === 0} aria-label={`Move ${p.name} up`}>Up</button>
                  </ActionForm>
                  <ActionForm action={moveInWaitlistAction} hidden={{ ...h, playerId: p.playerId, direction: 'down' }}>
                    <button type="submit" className="btn-quiet min-h-10 px-3 text-sm" disabled={i === v.waitlist.length - 1} aria-label={`Move ${p.name} down`}>Down</button>
                  </ActionForm>
                  <ActionForm action={organiserAddAction} hidden={{ ...h, playerId: p.playerId }}>
                    <button type="submit" className="btn-quiet min-h-10 px-3 text-sm">Give a place</button>
                  </ActionForm>
                  <ActionForm action={organiserRemoveAction} hidden={{ ...h, playerId: p.playerId }}>
                    <button type="submit" className="btn-quiet min-h-10 px-3 text-sm text-danger">Remove</button>
                  </ActionForm>
                </span>
              )}
            </li>
          ))}
          {v.waitlist.length === 0 && <li className="py-3 text-muted">Nobody waiting.</li>}
        </ol>
      </section>

      {editable && others.length > 0 && (
        <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="add-heading">
          <h2 id="add-heading" className="font-display text-2xl font-bold">Give a member a place</h2>
          <p className="mt-1 text-muted">Allowed even when the session is full (for example a walk-in or a regular). Guests are listed here too.</p>
          <ActionForm action={organiserAddAction} hidden={h} className="mt-4 flex flex-wrap items-center gap-2">
            <label htmlFor="add-player" className="sr-only">Member</label>
            <select id="add-player" name="playerId" defaultValue="" className="field max-w-xs">
              <option value="" disabled>Choose a member</option>
              {others.map((o) => <option key={o.playerId} value={o.playerId}>{o.firstName} {o.lastName}</option>)}
            </select>
            <button type="submit" className="btn-primary min-h-11">Add</button>
          </ActionForm>
        </section>
      )}

      {s.status !== 'cancelled' && window !== 'ended' && (
        <section className="mt-10 rounded-lg border border-danger p-5" aria-labelledby="cancel-heading">
          <h2 id="cancel-heading" className="font-display text-2xl font-bold text-danger">Cancel this session</h2>
          <p className="mt-1 text-muted">Everyone registered or waiting is notified in the app and by email.</p>
          <ActionForm action={cancelSessionAction} hidden={h} confirm="Cancel this session for everyone?" className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-60 flex-1">
              <label htmlFor="reason" className="label">Reason (optional)</label>
              <input id="reason" name="reason" maxLength={200} className="field" placeholder="For example: hall unavailable" />
            </div>
            <button type="submit" className="btn-quiet min-h-12 text-danger">Cancel session</button>
          </ActionForm>
        </section>
      )}
    </>
  );
}
