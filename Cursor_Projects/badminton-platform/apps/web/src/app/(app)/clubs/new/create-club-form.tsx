'use client';
import { useActionState } from 'react';
import { createClubAction, type CreateClubState } from './actions';

export function CreateClubForm({ timeZones, defaultTimeZone }: { timeZones: string[]; defaultTimeZone: string }) {
  const [state, action, pending] = useActionState<CreateClubState, FormData>(createClubAction, {});
  const v = state.values ?? { name: '', timeZone: defaultTimeZone, courts: '4', joinPolicy: 'open' };
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {e.form && <p className="rounded-lg border border-danger p-4 text-danger" role="alert">{e.form}</p>}
      <div>
        <label htmlFor="name" className="label">Club name</label>
        <input id="name" name="name" defaultValue={v.name} className="field" required maxLength={80} />
        {e.name && <p className="error" role="alert">{e.name}</p>}
      </div>
      <div>
        <label htmlFor="courts" className="label">Number of courts you usually book</label>
        <input id="courts" name="courts" type="number" inputMode="numeric" min={1} max={24} defaultValue={v.courts} className="field max-w-32" />
        <p className="hint">Courts are named Court 1, Court 2… You can rename them later.</p>
        {e.courts && <p className="error" role="alert">{e.courts}</p>}
      </div>
      <div>
        <label htmlFor="timeZone" className="label">Time zone</label>
        <select id="timeZone" name="timeZone" defaultValue={v.timeZone} className="field">
          {timeZones.map((tz) => (
            <option key={tz} value={tz}>{tz === 'Asia/Dubai' ? 'Asia/Dubai (UAE time)' : tz}</option>
          ))}
        </select>
        {e.timeZone && <p className="error" role="alert">{e.timeZone}</p>}
      </div>
      <fieldset>
        <legend className="label">Who can join</legend>
        <div className="grid gap-2">
          {[
            { value: 'open', label: 'Anyone with the link joins straight away' },
            { value: 'approval', label: 'People with the link ask to join; an owner or admin approves' },
          ].map((o) => (
            <label key={o.value} className="flex gap-3 rounded-lg border border-line p-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
              <input type="radio" name="joinPolicy" value={o.value} defaultChecked={v.joinPolicy === o.value} className="mt-1 size-5 accent-[var(--court)]" />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
        {e.joinPolicy && <p className="error" role="alert">{e.joinPolicy}</p>}
      </fieldset>
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? 'Creating…' : 'Create club'}
      </button>
    </form>
  );
}
