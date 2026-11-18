import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase';

export interface Account {
  id: string;
  email: string;
}

/** The signed-in account, verified with the auth server, or null. */
export async function getAccount(): Promise<Account | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

/** Use at the start of every protected page and server action. */
export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect('/sign-in');
  return account;
}
