import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccount } from '@/server/auth';
import { MemberError, acceptInvite } from '@/server/modules/members/commands';
import { getInviteSummary } from '@/server/modules/members/queries';
import { getOwnPlayer } from '@/server/modules/players/queries';

export const metadata: Metadata = { title: 'Club invitation' };

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const invite = /^[A-Za-z0-9_-]{20,64}$/.test(token) ? await getInviteSummary(token) : null;
  const here = `/invite/${token}`;

  async function accept() {
    'use server';
    const account = await getAccount();
    if (!account) redirect(`/sign-in?next=${encodeURIComponent(here)}`);
    let clubId: string;
    try {
      clubId = (await acceptInvite(account, token)).clubId;
    } catch (e) {
      if (e instanceof MemberError) redirect(`${here}?error=${encodeURIComponent(e.message)}`);
      throw e;
    }
    redirect(`/clubs/${clubId}`);
  }

  const account = await getAccount();
  const player = account ? await getOwnPlayer(account.id) : null;
  let body: React.ReactNode;
  if (!invite) body = <p className="mt-4">This invitation is not valid. Ask the club to send a new one.</p>;
  else if (invite.expired && !invite.used) body = <p className="mt-4">This invitation has expired. Ask the club to send a new one.</p>;
  else
    body = (
      <>
        <p className="mt-2 text-muted">This invitation was sent to {invite.email}.</p>
        {sp.error && <p className="mt-6 rounded-lg border border-danger p-4 text-danger" role="alert">{sp.error}</p>}
        <div className="mt-8">
          {!account ? (
            <Link href={`/sign-in?next=${encodeURIComponent(here)}`} className="btn-primary">Sign in to accept</Link>
          ) : !player ? (
            <Link href={`/me?next=${encodeURIComponent(here)}`} className="btn-primary">Create your profile first</Link>
          ) : (
            <form action={accept}>
              <button type="submit" className="btn-primary">Join {invite.club_name}</button>
            </form>
          )}
        </div>
      </>
    );

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="font-display text-xl font-bold">Club sessions</Link>
      <h1 className="page-title mt-10">{invite ? `Join ${invite.club_name}` : 'Club invitation'}</h1>
      {body}
    </main>
  );
}
