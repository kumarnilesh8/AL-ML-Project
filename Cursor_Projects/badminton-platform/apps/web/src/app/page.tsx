import Link from 'next/link';
import { CourtMark } from '@/components/court-mark';
import { getAccount } from '@/server/auth';

export default async function Home() {
  const account = await getAccount();
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-xl font-bold">Club sessions</span>
        <Link href={account ? '/me' : '/sign-in'} className="font-semibold text-court underline-offset-4 hover:underline">
          {account ? 'Open my page' : 'Sign in'}
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl">
            Fair games for every player, every session.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Take registrations with a waiting list, check players in, and let the app share out court time and build balanced
            doubles. Scores are confirmed by both teams, so everyone trusts the results.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={account ? '/me' : '/sign-in'} className="btn-primary">
              {account ? 'Go to my page' : 'Sign in with email'}
            </Link>
          </div>
        </div>
        <CourtMark className="w-full max-w-lg justify-self-center drop-shadow-sm" />
      </section>

      <footer className="border-t border-line pt-4 text-sm text-muted">Working name. Early preview for pilot clubs.</footer>
    </main>
  );
}
