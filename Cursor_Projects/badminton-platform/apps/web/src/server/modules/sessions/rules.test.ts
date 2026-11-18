import { describe, expect, it } from 'vitest';
import { defaultCapacity, isLateCancellation, registrationWindow } from './rules';
import { sessionFormSchema, toSessionValues } from './validation';

const at = (iso: string) => new Date(iso);
const base = {
  status: 'open' as const,
  registrationOpensAt: at('2026-11-01T00:00:00Z'),
  registrationClosesAt: at('2026-11-03T14:00:00Z'),
  startsAt: at('2026-11-03T16:00:00Z'),
  endsAt: at('2026-11-03T18:30:00Z'),
};

describe('registrationWindow', () => {
  it('moves through the lifecycle', () => {
    expect(registrationWindow(base, at('2026-10-31T12:00:00Z'))).toBe('not_open');
    expect(registrationWindow(base, at('2026-11-02T12:00:00Z'))).toBe('open');
    expect(registrationWindow(base, at('2026-11-03T15:00:00Z'))).toBe('closed');
    expect(registrationWindow(base, at('2026-11-03T17:00:00Z'))).toBe('started');
    expect(registrationWindow(base, at('2026-11-03T19:00:00Z'))).toBe('ended');
    expect(registrationWindow({ ...base, status: 'cancelled' }, at('2026-11-02T12:00:00Z'))).toBe('cancelled');
    expect(registrationWindow({ ...base, status: 'draft' }, at('2026-11-02T12:00:00Z'))).toBe('draft');
  });
});

describe('capacity and late cancellation', () => {
  it('defaults to six places per court', () => {
    expect(defaultCapacity(4)).toBe(24);
    expect(defaultCapacity(0)).toBe(4);
  });
  it('flags cancellations under 6 hours', () => {
    expect(isLateCancellation(at('2026-11-03T16:00:00Z'), at('2026-11-03T11:00:00Z'))).toBe(true);
    expect(isLateCancellation(at('2026-11-03T16:00:00Z'), at('2026-11-03T09:00:00Z'))).toBe(false);
  });
});

describe('session form', () => {
  const form = {
    title: 'Tuesday night',
    date: '2026-11-03',
    startTime: '22:30',
    endTime: '01:00',
    venue: 'Al Barsha hall',
    courtIds: ['00000000-0000-4000-8000-000000000001'],
    capacity: '12',
    preset: 'balanced',
    pointsToWin: '21',
    cap: '30',
    winByTwo: true,
    feeMember: '30',
    feeGuest: '40.50',
    feeJunior: '',
    visibility: 'club',
    closesHoursBefore: '2',
    publish: true,
  };
  it('accepts a late-night UAE session and stores fees in fils', () => {
    const v = sessionFormSchema.parse(form);
    const out = toSessionValues(v, 'Asia/Dubai', at('2026-10-30T10:00:00Z'));
    expect(out.errors).toEqual({});
    expect(out.endsNextDay).toBe(true);
    expect(out.values.startsAt.toISOString()).toBe('2026-11-03T18:30:00.000Z');
    expect(out.values.registrationClosesAt.toISOString()).toBe('2026-11-03T16:30:00.000Z');
    expect(out.values.fees).toEqual({ member: 3000, guest: 4050, junior: 0 });
  });
  it('rejects past dates, bad fees and a cap below the winning score', () => {
    const v = sessionFormSchema.parse(form);
    expect(toSessionValues(v, 'Asia/Dubai', at('2026-12-01T00:00:00Z')).errors.date).toBeTruthy();
    expect(sessionFormSchema.safeParse({ ...form, feeMember: '30,5' }).success).toBe(false);
    expect(sessionFormSchema.safeParse({ ...form, cap: '19' }).success).toBe(false);
    expect(sessionFormSchema.safeParse({ ...form, courtIds: [] }).success).toBe(false);
  });
});
