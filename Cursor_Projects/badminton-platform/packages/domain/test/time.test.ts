import { describe, expect, it } from 'vitest';
import { formatMoney, formatSessionRange, parseMoney, sessionTimes, utcToZoned, zoneLabel, zonedToUtc } from '../src/index';

describe('zonedToUtc', () => {
  it('UAE is UTC+4 all year (no daylight saving)', () => {
    expect(zonedToUtc('2026-01-15', '20:00', 'Asia/Dubai').toISOString()).toBe('2026-01-15T16:00:00.000Z');
    expect(zonedToUtc('2026-07-15', '20:00', 'Asia/Dubai').toISOString()).toBe('2026-07-15T16:00:00.000Z');
  });
  it('handles daylight saving zones on both sides of the change', () => {
    expect(zonedToUtc('2026-03-28', '19:00', 'Europe/London').toISOString()).toBe('2026-03-28T19:00:00.000Z'); // GMT
    expect(zonedToUtc('2026-03-30', '19:00', 'Europe/London').toISOString()).toBe('2026-03-30T18:00:00.000Z'); // BST
  });
  it('round-trips', () => {
    const d = zonedToUtc('2026-11-03', '21:45', 'Asia/Kolkata');
    expect(utcToZoned(d, 'Asia/Kolkata')).toEqual({ date: '2026-11-03', time: '21:45' });
  });
});

describe('sessionTimes', () => {
  it('a late session ends the next day', () => {
    const t = sessionTimes('2026-03-10', '22:30', '01:00', 'Asia/Dubai');
    expect(t.endsNextDay).toBe(true);
    expect(t.startsAt.toISOString()).toBe('2026-03-10T18:30:00.000Z');
    expect(t.endsAt.toISOString()).toBe('2026-03-10T21:00:00.000Z');
    expect(formatSessionRange(t.startsAt, t.endsAt, 'Asia/Dubai')).toBe('Tue 10 Mar, 10:30 pm – 1:00 am (+1 day)');
  });
  it('a normal evening session ends the same day', () => {
    const t = sessionTimes('2026-11-03', '20:00', '22:30', 'Asia/Dubai');
    expect(t.endsNextDay).toBe(false);
    expect(formatSessionRange(t.startsAt, t.endsAt, 'Asia/Dubai')).toBe('Tue 3 Nov, 8:00 pm – 10:30 pm');
  });
  it('month and year ends roll over', () => {
    expect(sessionTimes('2026-12-31', '23:00', '00:30', 'Asia/Dubai').endsAt.toISOString()).toBe('2026-12-31T20:30:00.000Z');
  });
});

describe('labels and money', () => {
  it('shows UAE time plainly', () => expect(zoneLabel('Asia/Dubai')).toBe('UAE time'));
  it('parses and formats AED', () => {
    expect(parseMoney('30')).toBe(3000);
    expect(parseMoney('30.5')).toBe(3050);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('-3')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(formatMoney(3000, 'AED')).toBe('AED 30');
    expect(formatMoney(3050, 'AED')).toBe('AED 30.50');
    expect(formatMoney(0, 'AED')).toBe('Free');
  });
});
