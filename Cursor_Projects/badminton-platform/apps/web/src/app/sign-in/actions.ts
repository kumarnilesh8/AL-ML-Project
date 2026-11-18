'use server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { supabaseServer } from '@/server/supabase';
import { safeNext } from '@/server/url';

export type SignInState = { status: 'idle' | 'sent' | 'error'; message?: string; email?: string };

const emailSchema = z.email('Enter a valid email address');

export async function sendSignInLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(String(formData.get('email') ?? '').trim().toLowerCase());
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message };

  const h = await headers();
  const origin = h.get('origin') ?? `http://${h.get('host') ?? 'localhost:3000'}`;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeNext(String(formData.get('next') ?? '')))}`, shouldCreateUser: true },
  });
  if (error) {
    const tooMany = /rate|seconds/i.test(error.message);
    return {
      status: 'error',
      email: parsed.data,
      message: tooMany ? 'Too many requests. Wait a minute, then try again.' : 'The sign-in email could not be sent. Try again.',
    };
  }
  return { status: 'sent', email: parsed.data };
}
