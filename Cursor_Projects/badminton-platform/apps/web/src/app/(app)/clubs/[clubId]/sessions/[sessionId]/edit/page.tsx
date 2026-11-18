import { utcToZoned, zoneLabel } from '@bp/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAccount } from '@/server/auth';
import { ORGANISERS, requireClubRole } from '@/server/authz';
import { getClubForMember } from '@/server/modules/clubs/queries';
import { getSessionView } from '@/server/modules/sessions/queries';
import { updateSessionAction } from '../../actions';
import { SessionForm } from '../../session-form';

export const metadata: Metadata = { title: 'Edit session' };

const money = (minor: number) => (minor ? (minor % 100 ? (minor / 100).toFixed(2) : String(minor / 100)) : '');

export default async function EditSessionPage({ params }: { params: Promise<{ clubId: string; sessionId: string }> }) {
  const { clubId, sessionId } = await params;
  const account = await requireAccount();
  await requireClubRole(account.id, clubId, ORGANISERS);
  const { club, courts } = await getClubForMember(account.id, clubId);
  const v = await getSessionView(account.id, clubId, sessionId);
  const s = v.session;
  const start = utcToZoned(s.startsAt, club.timeZone);
  const end = utcToZoned(s.endsAt, club.timeZone);
  return (
    <>
      <Link href={`/clubs/${clubId}/sessions/${sessionId}/manage`} className="text-sm font-semibold text-court underline-offset-4 hover:underline">{s.title}</Link>
      <h1 className="page-title mt-2">Edit session</h1>
      <p className="mt-2 text-muted">Everyone registered or waiting is told if the time or venue changes. Lowering the places moves the latest registrations to the top of the waiting list.</p>
      <div className="mt-8">
        <SessionForm
          action={updateSessionAction}
          clubId={clubId}
          sessionId={sessionId}
          courts={courts}
          currency={club.currency}
          zoneLabel={zoneLabel(club.timeZone)}
          mode="edit"
          defaults={{
            title: s.title,
            date: start.date,
            startTime: start.time,
            endTime: end.time,
            venue: s.venue,
            courtIds: v.courts.map((c) => c.id),
            capacity: String(s.capacity),
            preset: s.preset,
            pointsToWin: String(s.scoring.pointsToWin),
            cap: String(s.scoring.cap),
            winByTwo: s.scoring.winByTwo,
            feeMember: money(s.fees.member),
            feeGuest: money(s.fees.guest),
            feeJunior: money(s.fees.junior),
            visibility: s.visibility,
            closesHoursBefore: String(Math.round((s.startsAt.getTime() - s.registrationClosesAt.getTime()) / 3_600_000)),
          }}
        />
      </div>
    </>
  );
}
