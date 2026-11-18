import { z } from 'zod';

const zones = new Set(Intl.supportedValuesOf('timeZone'));

export const createClubSchema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters').max(80, 'Use at most 80 characters'),
  timeZone: z.string().refine((tz) => zones.has(tz) || tz === 'UTC', 'Choose a time zone from the list'),
  courts: z.coerce.number().int('Enter a whole number').min(1, 'At least 1 court').max(24, 'At most 24 courts'),
  joinPolicy: z.enum(['approval', 'open'], { message: 'Choose who can join' }),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;

/** "Dubai Smashers!" -> "dubai-smashers" (letters a–z and digits only; at least 3 characters). */
export function slugify(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
  return base.length >= 3 ? base : `club-${base || 'new'}`.slice(0, 50);
}

export const DEFAULT_TIME_ZONE = 'Asia/Dubai';
