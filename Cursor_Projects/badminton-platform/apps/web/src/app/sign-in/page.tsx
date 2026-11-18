import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccount } from '@/server/auth';
import { safeNext } from '@/server/url';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

const ERRORS: Record<string, string> = {
  link: 'That sign-in link has expired or was opened on a different device or browser. Request a new one here.',
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  if (await getAccount()) redirect(safeNext(next));
  const mailbox = process.env.NODE_ENV === 'development' ? (process.env.LOCAL_MAILBOX_URL ?? 'http://127.0.0.1:54324') : undefined;
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="font-display text-xl font-bold">
        Club sessions
      </Link>
      <h1 className="page-title mt-10">Sign in</h1>
      <p className="mt-2 text-muted">We will email you a link. Tap it and you are in.</p>
      {error && ERRORS[error] && (
        <p className="mt-6 rounded-lg border border-danger p-4 text-danger" role="alert">
          {ERRORS[error]}
        </p>
      )}
      <div className="mt-8">
        <SignInForm mailbox={mailbox} next={next ? safeNext(next) : undefined} />
      </div>
    </main>
  );
}
