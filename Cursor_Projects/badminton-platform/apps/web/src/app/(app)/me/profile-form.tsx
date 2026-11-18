'use client';
import { TIERS } from '@bp/domain';
import { useActionState } from 'react';
import { saveProfile, type ProfileState } from './actions';

export function ProfileForm({ initial, isNew, next }: { initial?: { firstName: string; lastName: string; tier: string | null }; isNew: boolean; next?: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const v = state.values ?? { firstName: initial?.firstName ?? '', lastName: initial?.lastName ?? '', tier: initial?.tier ?? '' };
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="label">First name</label>
          <input id="firstName" name="firstName" autoComplete="given-name" defaultValue={v.firstName} className="field" required />
          {e.firstName && <p className="error" role="alert">{e.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="label">Last name</label>
          <input id="lastName" name="lastName" autoComplete="family-name" defaultValue={v.lastName} className="field" />
          <p className="hint">Others see only your initial, for example “Aisha K.”</p>
          {e.lastName && <p className="error" role="alert">{e.lastName}</p>}
        </div>
      </div>

      <fieldset>
        <legend className="label">Your playing level</legend>
        <p className="hint mb-3 mt-0">Pick the closest match. Your organiser can adjust it, and your rating will settle as you play.</p>
        <div className="grid gap-2">
          {TIERS.map((t) => (
            <label key={t.value} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
              <input type="radio" name="tier" value={t.value} defaultChecked={v.tier === t.value} className="mt-1 size-5 accent-[var(--court)]" />
              <span>
                <span className="block font-semibold">{t.label}</span>
                <span className="block text-sm text-muted">{t.description}</span>
              </span>
            </label>
          ))}
        </div>
        {e.tier && <p className="error" role="alert">{e.tier}</p>}
      </fieldset>

      {isNew ? (
        <div>
          <label className="flex gap-3">
            <input type="checkbox" name="agree" className="mt-1 size-5 accent-[var(--court)]" />
            <span>I agree to the privacy notice and terms of use (draft for the pilot).</span>
          </label>
          {e.agree && <p className="error" role="alert">{e.agree}</p>}
        </div>
      ) : (
        <input type="hidden" name="agree" value="on" />
      )}

      <div className="flex items-center gap-4">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Saving…' : isNew ? 'Create my profile' : 'Save changes'}
        </button>
        {state.ok && <p role="status" className="font-semibold text-court">Saved</p>}
      </div>
    </form>
  );
}
