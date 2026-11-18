import 'server-only';
import { headers } from 'next/headers';

/** The address the visitor used (works on localhost, a phone on Wi-Fi, or the cloud). */
export async function baseUrl(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || /^\d/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Only allow redirects back into this site. */
export function safeNext(next: string | null | undefined, fallback = '/me'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
