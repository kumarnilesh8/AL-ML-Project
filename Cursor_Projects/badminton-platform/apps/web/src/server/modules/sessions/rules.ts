/** Pure session rules (FR-3, FR-4). */

export type SessionStatus = 'draft' | 'open' | 'live' | 'ended' | 'cancelled';
export type RegistrationWindow = 'draft' | 'not_open' | 'open' | 'closed' | 'started' | 'cancelled' | 'ended';

export interface SessionTiming {
  status: SessionStatus;
  startsAt: Date;
  endsAt: Date;
  registrationOpensAt: Date;
  registrationClosesAt: Date;
}

export function registrationWindow(s: SessionTiming, now: Date = new Date()): RegistrationWindow {
  if (s.status === 'cancelled') return 'cancelled';
  if (s.status === 'draft') return 'draft';
  if (s.status === 'ended' || now >= s.endsAt) return 'ended';
  if (now >= s.startsAt) return 'started';
  if (now < s.registrationOpensAt) return 'not_open';
  if (now >= s.registrationClosesAt) return 'closed';
  return 'open';
}

/** Default capacity: 4 players per court plus 2 waiting per court. */
export const defaultCapacity = (courts: number) => Math.min(200, Math.max(4, courts * 6));

/** Cancelling less than 6 hours before the start counts as late (shown to organisers only). */
export const LATE_CANCEL_HOURS = 6;
export const isLateCancellation = (startsAt: Date, now: Date = new Date()) => startsAt.getTime() - now.getTime() < LATE_CANCEL_HOURS * 3_600_000;
