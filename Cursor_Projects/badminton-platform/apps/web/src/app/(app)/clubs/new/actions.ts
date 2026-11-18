'use server';
import { redirect } from 'next/navigation';
import { requireAccount } from '@/server/auth';
import { NeedsProfileError, createClub } from '@/server/modules/clubs/commands';
import { createClubSchema } from '@/server/modules/clubs/validation';

export type CreateClubState = { errors?: Record<string, string>; values?: Record<string, string> };

export async function createClubAction(_prev: CreateClubState, formData: FormData): Promise<CreateClubState> {
  const account = await requireAccount();
  const values = Object.fromEntries(['name', 'timeZone', 'courts', 'joinPolicy'].map((k) => [k, String(formData.get(k) ?? '')]));
  const parsed = createClubSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors, values };
  }
  let clubId: string;
  try {
    clubId = (await createClub(account, parsed.data)).id;
  } catch (err) {
    if (err instanceof NeedsProfileError) return { errors: { form: err.message }, values };
    throw err;
  }
  redirect(`/clubs/${clubId}`);
}
