import { parseMoney, sessionTimes } from '@bp/domain';
import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a time like 20:00');

export const sessionFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Use at least 2 characters').max(80, 'Use at most 80 characters'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
    startTime: time,
    endTime: time,
    venue: z.string().trim().max(120, 'Use at most 120 characters').default(''),
    courtIds: z.array(z.uuid()).min(1, 'Choose at least one court'),
    capacity: z.coerce.number().int('Enter a whole number').min(4, 'At least 4 players').max(200, 'At most 200 players'),
    preset: z.enum(['social', 'balanced', 'competitive']),
    pointsToWin: z.coerce.number().int().min(11, 'At least 11 points').max(31, 'At most 31 points'),
    cap: z.coerce.number().int().min(11).max(50),
    winByTwo: z.boolean(),
    feeMember: z.string(),
    feeGuest: z.string(),
    feeJunior: z.string(),
    visibility: z.enum(['club', 'invited']),
    closesHoursBefore: z.coerce.number().min(0, 'Use 0 or more').max(72, 'At most 72 hours'),
    publish: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.cap < v.pointsToWin) ctx.addIssue({ code: 'custom', path: ['cap'], message: 'The cap must be at least the winning score' });
    for (const k of ['feeMember', 'feeGuest', 'feeJunior'] as const)
      if (parseMoney(v[k]) === null) ctx.addIssue({ code: 'custom', path: [k], message: 'Enter an amount like 30 or 30.50' });
  });

export type SessionFormInput = z.infer<typeof sessionFormSchema>;

/** Converts the form (club-local times) into stored values; checks length and that it starts in the future. */
export function toSessionValues(v: SessionFormInput, timeZone: string, now: Date = new Date()) {
  const { startsAt, endsAt, endsNextDay } = sessionTimes(v.date, v.startTime, v.endTime, timeZone);
  const errors: Record<string, string> = {};
  if (endsAt.getTime() - startsAt.getTime() > 12 * 3_600_000) errors.endTime = 'A session can last at most 12 hours';
  if (startsAt <= now) errors.date = 'Choose a start time in the future';
  const closesAt = new Date(startsAt.getTime() - v.closesHoursBefore * 3_600_000);
  const opensAt = closesAt <= now ? new Date(closesAt.getTime() - 60_000) : now;
  return {
    errors,
    endsNextDay,
    values: {
      title: v.title,
      venue: v.venue,
      startsAt,
      endsAt,
      capacity: v.capacity,
      preset: v.preset,
      scoring: { pointsToWin: v.pointsToWin, cap: v.cap, winByTwo: v.winByTwo },
      fees: { member: parseMoney(v.feeMember)!, guest: parseMoney(v.feeGuest)!, junior: parseMoney(v.feeJunior)! },
      visibility: v.visibility,
      registrationOpensAt: opensAt,
      registrationClosesAt: closesAt,
    },
  };
}
