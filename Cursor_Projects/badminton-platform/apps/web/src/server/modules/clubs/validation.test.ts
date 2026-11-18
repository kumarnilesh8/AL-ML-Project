import { describe, expect, it } from 'vitest';
import { createClubSchema, slugify } from './validation';

describe('slugify', () => {
  it.each([
    ['Dubai Smashers', 'dubai-smashers'],
    ['  Al Barsha   Badminton Club!! ', 'al-barsha-badminton-club'],
    ['Café Shuttle', 'cafe-shuttle'],
    ['AB', 'club-ab'],
    ['!!!', 'club-new'],
  ])('%s -> %s', (name, slug) => expect(slugify(name)).toBe(slug));

  it('always matches the database rule', () => {
    for (const n of ['x', 'Sharjah Shuttlers 2026', 'ميدان', '---a---', 'a'.repeat(200)]) {
      expect(slugify(n)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(slugify(n).length).toBeGreaterThanOrEqual(3);
      expect(slugify(n).length).toBeLessThanOrEqual(60);
    }
  });
});

describe('createClubSchema', () => {
  const valid = { name: 'Dubai Smashers', timeZone: 'Asia/Dubai', courts: '4', joinPolicy: 'approval' };
  it('accepts a valid club and converts the court count', () => {
    expect(createClubSchema.parse(valid)).toEqual({ ...valid, courts: 4 });
  });
  it('rejects unknown time zones and impossible court counts', () => {
    expect(createClubSchema.safeParse({ ...valid, timeZone: 'Mars/Olympus' }).success).toBe(false);
    expect(createClubSchema.safeParse({ ...valid, courts: '0' }).success).toBe(false);
    expect(createClubSchema.safeParse({ ...valid, courts: '25' }).success).toBe(false);
    expect(createClubSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });
});
