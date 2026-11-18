'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { safeNext } from '@/server/url';
import { requireAccount } from '@/server/auth';
import { saveOwnProfile } from '@/server/modules/players/commands';
import { profileSchema } from '@/server/modules/players/validation';

export type ProfileState = { ok?: boolean; errors?: Record<string, string>; values?: Record<string, string> };

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const account = await requireAccount();
  const values = Object.fromEntries(['firstName', 'lastName', 'tier', 'agree'].map((k) => [k, String(formData.get(k) ?? '')]));
  const parsed = profileSchema.safeParse({ ...values, agree: values.agree || undefined });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors, values };
  }
  await saveOwnProfile(account, parsed.data);
  revalidatePath('/me');
  const next = String(formData.get('next') ?? '');
  if (next) redirect(safeNext(next));
  return { ok: true };
}
