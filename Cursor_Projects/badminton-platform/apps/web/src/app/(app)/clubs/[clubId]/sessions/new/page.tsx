import { zoneLabel } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAccount } from '@/server/auth';
import { ORGANISERS, requireClubRole } from '@/server/authz';
import { getClubForMember } from '@/server/modules/clubs/queries';
import { defaultCapacity } from '@/server/modules/sessions/rules';
import { createSessionAction } from '../actions';
import { SessionForm } from '../session-form';

export const metadata: Metadata = { title: 'New session' };

export default async function NewSessionPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const account = await requireAccount();
  await requireClubRole(account.id, clubId, ORGANISERS);
  const { club, courts } = await getClubForMember(account.id, clubId);
  const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA', { timeZone: club.timeZone });
  return (
    <>
      <Link href={`/clubs/${clubId}`} className="text-sm font-semibold text-court underline-offset-4 hover:underline">{club.name}</Link>
      <h1 className="page-title mt-2">New session</h1>
      <div className="mt-8">
        <SessionForm
          action={createSessionAction}
          clubId={clubId}
          courts={courts}
          currency={club.currency}
          zoneLabel={zoneLabel(club.timeZone)}
          mode="create"
          defaults={{
            title: 'Club session',
            date: tomorrow,
            startTime: '20:00',
            endTime: '22:30',
            venue: '',
            courtIds: courts.map((c) => c.id),
            capacity: String(defaultCapacity(courts.length)),
            preset: 'balanced',
            pointsToWin: '21',
            cap: '30',
            winByTwo: true,
            feeMember: '',
            feeGuest: '',
            feeJunior: '',
            visibility: 'club',
            closesHoursBefore: '2',
          }}
        />
      </div>
    </>
  );
}
