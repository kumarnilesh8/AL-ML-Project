import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccount } from '@/server/auth';
import { MemberError, joinByCode } from '@/server/modules/members/commands';
import { getClubByJoinCode } from '@/server/modules/members/queries';
import { getOwnPlayer } from '@/server/modules/players/queries';

export const metadata: Metadata = { title: 'Join a club' };

export default async function JoinPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ error?: string; requested?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  const club = await getClubByJoinCode(code);
  const here = `/join/${code}`;

  async function join() {
    'use server';
    const account = await getAccount();
    if (!account) redirect(`/sign-in?next=${encodeURIComponent(here)}`);
    let result;
    try {
      result = await joinByCode(account, code);
    } catch (e) {
      if (e instanceof MemberError) redirect(`${here}?error=${encodeURIComponent(e.message)}`);
      throw e;
    }
    redirect(result.status === 'active' ? `/clubs/${result.clubId}` : `${here}?requested=1`);
  }

  let body: React.ReactNode;
  if (!club) {
    body = <p className="mt-4">This join link is not valid any more. Ask the club for a new one.</p>;
  } else if (sp.requested) {
    body = <p className="mt-4 rounded-lg bg-sunken p-5">Request sent. You will be able to open the club once an owner or admin approves you.</p>;
  } else {
    const account = await getAccount();
    const player = account ? await getOwnPlayer(account.id) : null;
    body = (
      <>
        <p className="mt-2 text-muted">
          {club.joinPolicy === 'open' ? 'Join to register for sessions and get fair games.' : 'Ask to join. An owner or admin will approve your request.'}
        </p>
        {sp.error && <p className="mt-6 rounded-lg border border-danger p-4 text-danger" role="alert">{sp.error}</p>}
        <div className="mt-8">
          {!account ? (
            <Link href={`/sign-in?next=${encodeURIComponent(here)}`} className="btn-primary">Sign in to join</Link>
          ) : !player ? (
            <Link href={`/me?next=${encodeURIComponent(here)}`} className="btn-primary">Create your profile first</Link>
          ) : (
            <form action={join}>
              <button type="submit" className="btn-primary">{club.joinPolicy === 'open' ? `Join ${club.name}` : 'Ask to join'}</button>
            </form>
          )}
        </div>
      </>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="font-display text-xl font-bold">Club sessions</Link>
      <h1 className="page-title mt-10">{club ? club.name : 'Join a club'}</h1>
      {body}
    </main>
  );
}
