'use server';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/components/action-form';
import { requireAccount } from '@/server/auth';
import { ForbiddenError } from '@/server/authz';
import { addChild, removeChild } from '@/server/modules/family/commands';
import { childSchema } from '@/server/modules/family/validation';

const str = (f: FormData, k: string) => String(f.get(k) ?? '');

export async function addChildAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const parsed = childSchema.safeParse({
    firstName: str(f, 'firstName'),
    lastName: str(f, 'lastName'),
    ageBand: str(f, 'ageBand') || undefined,
    tier: str(f, 'tier') || undefined,
    consent: str(f, 'consent') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  await addChild(account, parsed.data);
  revalidatePath('/me/family');
  return { ok: `${parsed.data.firstName} added. Open a club page to add them to that club.` };
}

export async function removeChildAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  try {
    await removeChild(account, str(f, 'childId'));
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
  revalidatePath('/me/family');
  return {};
}
