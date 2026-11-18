import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/server/supabase';

/** The sign-in link lands here: exchange the one-time code for a session. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/me';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/me';

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL('/sign-in?error=link', url.origin));
}
