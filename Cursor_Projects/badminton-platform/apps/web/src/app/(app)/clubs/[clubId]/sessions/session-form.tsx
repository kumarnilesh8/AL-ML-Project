'use client';
import { useActionState } from 'react';
import type { SessionFormState } from './actions';

export interface SessionFormDefaults {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  courtIds: string[];
  capacity: string;
  preset: string;
  pointsToWin: string;
  cap: string;
  winByTwo: boolean;
  feeMember: string;
  feeGuest: string;
  feeJunior: string;
  visibility: string;
  closesHoursBefore: string;
}

const PRESETS = [
  { value: 'social', label: 'Social', hint: 'Mix everyone; variety first' },
  { value: 'balanced', label: 'Balanced', hint: 'Close games with plenty of variety' },
  { value: 'competitive', label: 'Competitive', hint: 'Similar levels play together' },
];

export function SessionForm({
  action,
  clubId,
  sessionId,
  courts,
  currency,
  zoneLabel,
  defaults,
  mode,
}: {
  action: (p: SessionFormState, f: FormData) => Promise<SessionFormState>;
  clubId: string;
  sessionId?: string;
  courts: { id: string; name: string }[];
  currency: string;
  zoneLabel: string;
  defaults: SessionFormDefaults;
  mode: 'create' | 'edit';
}) {
  const [state, run, pending] = useActionState<SessionFormState, FormData>(action, {});
  const v = { ...defaults, ...(state.values ?? {}) } as SessionFormDefaults;
  const e = state.errors ?? {};
  const err = (k: string) => e[k] && <p className="error" role="alert">{e[k]}</p>;
  return (
    <form action={run} className="space-y-8" noValidate>
      <input type="hidden" name="clubId" value={clubId} />
      {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
      {e.form && <p className="rounded-lg border border-danger p-4 text-danger" role="alert">{e.form}</p>}

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl font-bold">When and where</legend>
        <div>
          <label htmlFor="title" className="label">Name</label>
          <input id="title" name="title" defaultValue={v.title} className="field" />
          {err('title')}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input id="date" name="date" type="date" defaultValue={v.date} className="field" />
            {err('date')}
          </div>
          <div>
            <label htmlFor="startTime" className="label">Starts</label>
            <input id="startTime" name="startTime" type="time" defaultValue={v.startTime} className="field" />
            {err('startTime')}
          </div>
          <div>
            <label htmlFor="endTime" className="label">Ends</label>
            <input id="endTime" name="endTime" type="time" defaultValue={v.endTime} className="field" />
            {err('endTime')}
          </div>
        </div>
        <p className="hint">Times are in {zoneLabel}. An end time earlier than the start (for example 22:30 to 01:00) means the next day.</p>
        <div>
          <label htmlFor="venue" className="label">Venue</label>
          <input id="venue" name="venue" defaultValue={v.venue} className="field" placeholder="Hall name and area" />
          {err('venue')}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl font-bold">Courts and players</legend>
        <div>
          <p className="label">Courts booked</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {courts.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-lg border border-line p-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
                <input type="checkbox" name="courtIds" value={c.id} defaultChecked={v.courtIds.includes(c.id)} className="size-5 accent-[var(--court)]" />
                {c.name}
              </label>
            ))}
          </div>
          {err('courtIds')}
        </div>
        <div>
          <label htmlFor="capacity" className="label">Player places</label>
          <input id="capacity" name="capacity" type="number" inputMode="numeric" min={4} max={200} defaultValue={v.capacity} className="field max-w-32" />
          <p className="hint">Suggested: 6 per court (4 playing, 2 resting). When it is full, people join a waiting list.</p>
          {err('capacity')}
        </div>
        <fieldset>
          <legend className="label">How games are matched</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <label key={p.value} className="flex gap-2 rounded-lg border border-line p-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
                <input type="radio" name="preset" value={p.value} defaultChecked={v.preset === p.value} className="mt-1 size-5 accent-[var(--court)]" />
                <span><span className="block font-semibold">{p.label}</span><span className="text-sm text-muted">{p.hint}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="pointsToWin" className="label">Game to</label>
            <input id="pointsToWin" name="pointsToWin" type="number" inputMode="numeric" defaultValue={v.pointsToWin} className="field" />
            {err('pointsToWin')}
          </div>
          <div>
            <label htmlFor="cap" className="label">Maximum score</label>
            <input id="cap" name="cap" type="number" inputMode="numeric" defaultValue={v.cap} className="field" />
            {err('cap')}
          </div>
          <label className="flex items-center gap-3 self-end pb-3">
            <input type="checkbox" name="winByTwo" defaultChecked={v.winByTwo} className="size-5 accent-[var(--court)]" />
            Win by 2
          </label>
        </div>
        <p className="hint -mt-2">Each match is one game.</p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl font-bold">Fees and registration</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {(['feeMember', 'feeGuest', 'feeJunior'] as const).map((k) => (
            <div key={k}>
              <label htmlFor={k} className="label">{k === 'feeMember' ? 'Members' : k === 'feeGuest' ? 'Guests' : 'Juniors'} ({currency})</label>
              <input id={k} name={k} inputMode="decimal" defaultValue={v[k]} className="field" placeholder="0" />
              {err(k)}
            </div>
          ))}
        </div>
        <p className="hint">Leave empty or 0 for free. Payments are recorded by organisers; nothing is charged online.</p>
        <div>
          <label htmlFor="closesHoursBefore" className="label">Registration closes (hours before the start)</label>
          <input id="closesHoursBefore" name="closesHoursBefore" type="number" inputMode="numeric" min={0} max={72} defaultValue={v.closesHoursBefore} className="field max-w-32" />
          {err('closesHoursBefore')}
        </div>
        <fieldset>
          <legend className="label">Who can register</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex gap-2 rounded-lg border border-line p-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
              <input type="radio" name="visibility" value="club" defaultChecked={v.visibility !== 'invited'} className="mt-1 size-5 accent-[var(--court)]" />
              All club members
            </label>
            <label className="flex gap-2 rounded-lg border border-line p-3 has-[:checked]:border-court has-[:checked]:bg-sunken">
              <input type="radio" name="visibility" value="invited" defaultChecked={v.visibility === 'invited'} className="mt-1 size-5 accent-[var(--court)]" />
              Only people I add (organisers give places)
            </label>
          </div>
        </fieldset>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="publish" className="btn-primary" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create and open registration' : 'Save changes'}
        </button>
        {mode === 'create' && (
          <button type="submit" name="intent" value="draft" className="btn-quiet" disabled={pending}>Save as draft</button>
        )}
      </div>
    </form>
  );
}
