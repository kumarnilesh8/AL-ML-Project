import { TIERS, tierLabel, type Tier } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { requireAccount } from '@/server/auth';
import { listChildren } from '@/server/modules/family/queries';
import { AGE_BAND_LABELS } from '@/server/modules/family/validation';
import { addChildAction, removeChildAction } from './actions';

export const metadata: Metadata = { title: 'My family' };

export default async function FamilyPage() {
  const account = await requireAccount();
  const children = await listChildren(account.id);
  return (
    <>
      <Link href="/me" className="text-sm font-semibold text-court underline-offset-4 hover:underline">My page</Link>
      <h1 className="page-title mt-2">My family</h1>
      <p className="mt-2 max-w-prose text-muted">
        Add children who play with you. You manage everything for them: registration, check-in and results. Other people see only their
        first name and initial, with no photo, and their rating stays private.
      </p>

      {children.length > 0 && (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {children.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold">{c.firstName} {c.lastName}</p>
                <p className="text-sm text-muted">
                  {AGE_BAND_LABELS[c.ageBand]}
                  {c.tier && ` · ${tierLabel(c.tier as Tier)}`}
                  {c.clubs.length ? ` · ${c.clubs.map((x) => x.name).join(', ')}` : ' · Not in a club yet'}
                </p>
              </div>
              <ActionForm action={removeChildAction} hidden={{ childId: c.id }} confirm={`Remove ${c.firstName}'s profile? Their game history stays as "Former player".`}>
                <button type="submit" className="btn-quiet min-h-10 px-4 text-sm text-danger">Remove</button>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8 rounded-lg border border-line p-5" aria-labelledby="add-child">
        <h2 id="add-child" className="font-display text-2xl font-bold">Add a child</h2>
        <ActionForm action={addChildAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-first" className="label">First name</label>
            <input id="c-first" name="firstName" className="field" required />
          </div>
          <div>
            <label htmlFor="c-last" className="label">Last name</label>
            <input id="c-last" name="lastName" className="field" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="label">Age</legend>
            <div className="flex flex-wrap gap-2">
              {(['under_14', '14_17'] as const).map((b) => (
                <label key={b} className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
                  <input type="radio" name="ageBand" value={b} className="size-5 accent-[var(--court)]" />
                  {AGE_BAND_LABELS[b]}
                </label>
              ))}
            </div>
            <p className="hint">We only ask for an age band, never a date of birth.</p>
          </fieldset>
          <div className="sm:col-span-2">
            <label htmlFor="c-tier" className="label">Level</label>
            <select id="c-tier" name="tier" defaultValue="" className="field">
              <option value="" disabled>Choose a level</option>
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}: {t.description}</option>
              ))}
            </select>
          </div>
          <label className="flex gap-3 sm:col-span-2">
            <input type="checkbox" name="consent" className="mt-1 size-5 accent-[var(--court)]" />
            <span>I am this child’s parent or guardian and agree to the privacy notice on their behalf.</span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">Add child</button>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
