import type { Metadata } from 'next';
import { DEFAULT_TIME_ZONE } from '@/server/modules/clubs/validation';
import { CreateClubForm } from './create-club-form';

export const metadata: Metadata = { title: 'Create a club' };

export default function NewClubPage() {
  const zones = [DEFAULT_TIME_ZONE, ...Intl.supportedValuesOf('timeZone').filter((z) => z !== DEFAULT_TIME_ZONE)];
  return (
    <>
      <h1 className="page-title">Create a club</h1>
      <p className="mt-2 max-w-prose text-muted">You will be the club owner. Next you will get a join link to share with your players.</p>
      <div className="mt-8">
        <CreateClubForm timeZones={zones} defaultTimeZone={DEFAULT_TIME_ZONE} />
      </div>
    </>
  );
}
