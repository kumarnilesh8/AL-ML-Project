import { TIERS, tierLabel, type Tier } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { requireAccount } from '@/server/auth';
import { requireClubRole } from '@/server/authz';
import { getClubForMember } from '@/server/modules/clubs/queries';
import { listMembers, type MemberFilter } from '@/server/modules/members/queries';
import { ROLE_LABELS, assignableRoles, canAddGuests, canManageMembers, canRemove } from '@/server/modules/members/rules';
import { addGuestAction, decideAction, inviteAction, removeAction, setRoleAction } from '../actions';

export const metadata: Metadata = { title: 'Members' };

const FILTERS: { value: MemberFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'organisers', label: 'Organisers' },
  { value: 'guests', label: 'Guests' },
  { value: 'juniors', label: 'Juniors' },
  { value: 'pending', label: 'Requests' },
];

export default async function MembersPage({ params, searchParams }: { params: Promise<{ clubId: string }>; searchParams: Promise<{ q?: string; filter?: string }> }) {
  const { clubId } = await params;
  const sp = await searchParams;
  const account = await requireAccount();
  const me = await requireClubRole(account.id, clubId);
  const { club } = await getClubForMember(account.id, clubId);
  const filter = (FILTERS.find((f) => f.value === sp.filter)?.value ?? 'all') as MemberFilter;
  const rows = await listMembers(clubId, { accountId: account.id, role: me.role }, { q: sp.q, filter });
  const manager = canManageMembers(me.role);

  return (
    <>
      <Link href={`/clubs/${clubId}`} className="text-sm font-semibold text-court underline-offset-4 hover:underline">{club.name}</Link>
      <h1 className="page-title mt-2">Members</h1>

      <form className="mt-6 flex flex-wrap gap-2" role="search">
        <input type="hidden" name="filter" value={filter} />
        <label htmlFor="q" className="sr-only">Search by name</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Search by name" className="field max-w-xs flex-1" />
        <button type="submit" className="btn-quiet">Search</button>
      </form>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filter members">
        {FILTERS.filter((f) => f.value !== 'pending' || manager).map((f) => (
          <Link
            key={f.value}
            href={`?filter=${f.value}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`}
            aria-current={filter === f.value ? 'page' : undefined}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold aria-[current=page]:border-court aria-[current=page]:bg-court aria-[current=page]:text-on-court"
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-lg bg-sunken p-5">{filter === 'pending' ? 'No requests waiting.' : 'Nobody matches. Try another search or filter.'}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {rows.map((r) => {
            const roles = r.status === 'active' && r.kind === 'member' ? assignableRoles(me.role, r.role, r.isMe) : [];
            const removable = r.status === 'active' && canRemove(me.role, r.role, r.isMe);
            return (
              <li key={r.playerId} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-semibold">
                    {r.name}
                    {r.isMe && <span className="font-normal text-muted"> (you)</span>}
                  </span>
                  <span className="text-sm text-muted">
                    {ROLE_LABELS[r.role]}
                    {r.kind === 'guest' && ' · Guest'}
                    {r.kind === 'junior' && ` · Junior (${r.ageBand === 'under_14' ? 'Under 14' : '14–17'})`}
                    {r.tier && ` · ${tierLabel(r.tier as Tier)}`}
                  </span>
                </div>
                {r.email && <p className="text-sm text-muted">{r.email}</p>}

                {r.status === 'pending' && manager && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionForm action={decideAction} hidden={{ clubId, playerId: r.playerId, decision: 'approve' }}>
                      <button type="submit" className="btn-primary min-h-10 px-4 text-sm">Approve</button>
                    </ActionForm>
                    <ActionForm action={decideAction} hidden={{ clubId, playerId: r.playerId, decision: 'decline' }}>
                      <button type="submit" className="btn-quiet min-h-10 px-4 text-sm">Decline</button>
                    </ActionForm>
                  </div>
                )}

                {(roles.length > 0 || removable) && (
                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    {roles.length > 0 && (
                      <ActionForm action={setRoleAction} hidden={{ clubId, playerId: r.playerId }} className="flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`role-${r.playerId}`}>Role for {r.name}</label>
                        <select id={`role-${r.playerId}`} name="role" defaultValue={r.role} className="field w-auto py-2">
                          {roles.map((x) => (
                            <option key={x} value={x}>{ROLE_LABELS[x]}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn-quiet min-h-10 px-4 text-sm">Change role</button>
                      </ActionForm>
                    )}
                    {removable && (
                      <ActionForm
                        action={removeAction}
                        hidden={{ clubId, playerId: r.playerId }}
                        confirm={r.isMe ? 'Leave this club?' : `Remove ${r.name} from the club? Their game history is kept.`}
                      >
                        <button type="submit" className="btn-quiet min-h-10 px-4 text-sm text-danger">{r.isMe ? 'Leave club' : 'Remove'}</button>
                      </ActionForm>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canAddGuests(me.role) && (
        <section className="mt-10 rounded-lg border border-line p-5" aria-labelledby="guest-heading">
          <h2 id="guest-heading" className="font-display text-2xl font-bold">Add a guest</h2>
          <p className="mt-1 text-muted">For someone without an account, such as a visitor or a player without a smartphone.</p>
          <ActionForm action={addGuestAction} hidden={{ clubId }} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="g-first" className="label">First name</label>
              <input id="g-first" name="firstName" className="field" required />
            </div>
            <div>
              <label htmlFor="g-last" className="label">Last name (optional)</label>
              <input id="g-last" name="lastName" className="field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="g-tier" className="label">Level</label>
              <select id="g-tier" name="tier" defaultValue="" className="field">
                <option value="" disabled>Choose a level</option>
                {TIERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}: {t.description}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">Add guest</button>
            </div>
          </ActionForm>
        </section>
      )}

      {manager && (
        <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="email-heading">
          <h2 id="email-heading" className="font-display text-2xl font-bold">Invite by email</h2>
          <p className="mt-1 text-muted">Each person gets a personal link, valid for 14 days. They join without approval.</p>
          <ActionForm action={inviteAction} hidden={{ clubId }} className="mt-4 space-y-3">
            <label htmlFor="emails" className="label">Email addresses</label>
            <textarea id="emails" name="emails" rows={3} className="field" placeholder="aisha@example.com, ben@example.com" />
            <p className="hint">Separate addresses with commas or new lines. Up to 50 at a time.</p>
            <button type="submit" className="btn-primary">Send invitations</button>
          </ActionForm>
        </section>
      )}
    </>
  );
}
