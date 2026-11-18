import { describe, expect, it } from 'vitest';
import { displayNameOf, profileSchema } from './validation';

describe('profileSchema', () => {
  it('requires a first name, a level and agreement', () => {
    expect(profileSchema.safeParse({ firstName: 'Aisha', tier: 'intermediate', agree: 'on' }).success).toBe(true);
    expect(profileSchema.safeParse({ firstName: ' ', tier: 'intermediate', agree: 'on' }).success).toBe(false);
    expect(profileSchema.safeParse({ firstName: 'Aisha', tier: 'pro', agree: 'on' }).success).toBe(false);
    expect(profileSchema.safeParse({ firstName: 'Aisha', tier: 'intermediate' }).success).toBe(false);
  });
});

describe('displayNameOf', () => {
  it('uses first name and surname initial', () => {
    expect(displayNameOf('Aisha', 'Khan')).toBe('Aisha K.');
    expect(displayNameOf('Ben', '')).toBe('Ben');
  });
});
