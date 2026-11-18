import { describe, expect, it } from 'vitest';
import { newInviteToken, newJoinCode, hashToken } from './tokens';
import { JOIN_CODE, guestSchema, parseEmailList } from './validation';

describe('parseEmailList', () => {
  it('splits, normalises and de-duplicates', () => {
    const r = parseEmailList('Aisha@Example.com, ben@example.com\nben@example.com; not-an-email  omar@test.ae');
    expect(r.valid).toEqual(['aisha@example.com', 'ben@example.com', 'omar@test.ae']);
    expect(r.invalid).toEqual(['not-an-email']);
    expect(r.tooMany).toBe(false);
  });
  it('limits the number of invitations per send', () => {
    const r = parseEmailList(Array.from({ length: 60 }, (_, i) => `p${i}@x.com`).join(' '));
    expect(r.valid).toHaveLength(50);
    expect(r.tooMany).toBe(true);
  });
});

describe('tokens', () => {
  it('join codes match the database format and are readable', () => {
    for (let i = 0; i < 200; i++) {
      const c = newJoinCode();
      expect(c).toMatch(JOIN_CODE);
      expect(c).not.toMatch(/[lo01]/);
    }
  });
  it('invite tokens are random and stored only as a hash', () => {
    const a = newInviteToken();
    const b = newInviteToken();
    expect(a.token).not.toEqual(b.token);
    expect(a.hash).toEqual(hashToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });
});

describe('guestSchema', () => {
  it('needs a first name and a level', () => {
    expect(guestSchema.safeParse({ firstName: 'Mark', tier: 'improver' }).success).toBe(true);
    expect(guestSchema.safeParse({ firstName: '', tier: 'improver' }).success).toBe(false);
  });
});
