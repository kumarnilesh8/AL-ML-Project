'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/components/action-form';
import { requireAccount } from '@/server/auth';
import { ForbiddenError } from '@/server/authz';
import * as S from '@/server/modules/sessions/commands';
import { sessionFormSchema } from '@/server/modules/sessions/validation';

const str = (f: FormData, k: string) => String(f.get(k) ?? '');

export type SessionFormState = { errors?: Record<string, string>; values?: Record<string, string | string[] | boolean> };

function readForm(f: FormData) {
  return {
    title: str(f, 'title'),
    date: str(f, 'date'),
    startTime: str(f, 'startTime'),
    endTime: str(f, 'endTime'),
    venue: str(f, 'venue'),
    courtIds: f.getAll('courtIds').map(String),
    capacity: str(f, 'capacity'),
    preset: str(f, 'preset'),
    pointsToWin: str(f, 'pointsToWin'),
    cap: str(f, 'cap'),
    winByTwo: f.get('winByTwo') === 'on',
    feeMember: str(f, 'feeMember'),
    feeGuest: str(f, 'feeGuest'),
    feeJunior: str(f, 'feeJunior'),
    visibility: str(f, 'visibility') || 'club',
    closesHoursBefore: str(f, 'closesHoursBefore'),
    publish: str(f, 'intent') !== 'draft',
  };
}

async function save(f: FormData, mode: 'create' | 'edit'): Promise<SessionFormState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  const raw = readForm(f);
  const parsed = sessionFormSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors, values: raw };
  }
  let sessionId = str(f, 'sessionId');
  try {
    if (mode === 'create') sessionId = await S.createSession(account, clubId, parsed.data);
    else await S.updateSession(account, sessionId, parsed.data);
  } catch (e) {
    if (e instanceof S.SessionValidationError) return { errors: e.fieldErrors, values: raw };
    if (e instanceof S.SessionError || e instanceof ForbiddenError) return { errors: { form: e.message }, values: raw };
    throw e;
  }
  revalidatePath(`/clubs/${clubId}`, 'layout');
  redirect(`/clubs/${clubId}/sessions/${sessionId}${mode === 'create' ? '/manage' : '/manage'}`);
}

export async function createSessionAction(_p: SessionFormState, f: FormData) {
  return save(f, 'create');
}
export async function updateSessionAction(_p: SessionFormState, f: FormData) {
  return save(f, 'edit');
}

/** Runs a session command and turns expected problems into a message. */
async function run(f: FormData, fn: (account: Awaited<ReturnType<typeof requireAccount>>) => Promise<string | void>): Promise<ActionState> {
  const account = await requireAccount();
  try {
    const ok = await fn(account);
    revalidatePath(`/clubs/${str(f, 'clubId')}`, 'layout');
    return { ok: ok || undefined };
  } catch (e) {
    if (e instanceof S.SessionError || e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
}

export async function registerAction(_p: ActionState, f: FormData) {
  return run(f, async (a) => {
    const r = await S.register(a, str(f, 'sessionId'), str(f, 'playerId'));
    return r.status === 'registered' ? 'You have a place.' : `The session is full: number ${r.position} on the waiting list.`;
  });
}
export async function cancelRegistrationAction(_p: ActionState, f: FormData) {
  return run(f, async (a) => {
    await S.cancelRegistration(a, str(f, 'sessionId'), str(f, 'playerId'));
    return 'Cancelled.';
  });
}
export async function organiserAddAction(_p: ActionState, f: FormData) {
  return run(f, async (a) => {
    if (!str(f, 'playerId')) throw new S.SessionError('Choose a member.');
    const r = await S.organiserAdd(a, str(f, 'sessionId'), str(f, 'playerId'));
    return r.overCapacity ? 'Added. The session is now over capacity.' : 'Added.';
  });
}
export async function moveToWaitlistAction(_p: ActionState, f: FormData) {
  return run(f, (a) => S.organiserMoveToWaitlist(a, str(f, 'sessionId'), str(f, 'playerId')));
}
export async function moveInWaitlistAction(_p: ActionState, f: FormData) {
  return run(f, (a) => S.moveInWaitlist(a, str(f, 'sessionId'), str(f, 'playerId'), str(f, 'direction') === 'up' ? 'up' : 'down'));
}
export async function organiserRemoveAction(_p: ActionState, f: FormData) {
  return run(f, (a) => S.organiserRemove(a, str(f, 'sessionId'), str(f, 'playerId')));
}
export async function openSessionAction(_p: ActionState, f: FormData) {
  return run(f, async (a) => {
    await S.openSession(a, str(f, 'sessionId'));
    return 'Registration is open.';
  });
}
export async function cancelSessionAction(_p: ActionState, f: FormData) {
  return run(f, async (a) => {
    await S.cancelSession(a, str(f, 'sessionId'), str(f, 'reason').trim().slice(0, 200));
    return 'Session cancelled. Everyone registered has been told.';
  });
}
export async function duplicateSessionAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  let copy: string;
  try {
    copy = await S.duplicateSession(account, str(f, 'sessionId'));
  } catch (e) {
    if (e instanceof S.SessionError || e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
  redirect(`/clubs/${str(f, 'clubId')}/sessions/${copy}/edit`);
}
