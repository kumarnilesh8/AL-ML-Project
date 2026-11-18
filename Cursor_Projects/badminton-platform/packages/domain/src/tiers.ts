import type { Tier } from './types';

/** Plain-language playing levels shown at sign-up (original wording for this product). */
export const TIERS: { value: Tier; label: string; description: string }[] = [
  { value: 'new', label: 'New to badminton', description: 'Learning grips, serves and basic rallies.' },
  { value: 'beginner', label: 'Beginner', description: 'Can rally; still learning rules and positions.' },
  { value: 'improver', label: 'Improver', description: 'Plays regularly; consistent clears and serves.' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable in club doubles; knows rotation.' },
  { value: 'advanced', label: 'Advanced', description: 'Strong club player; attacks and defends well.' },
  { value: 'competitive', label: 'Competitive', description: 'Plays league or tournament level.' },
];

export const TIER_VALUES = TIERS.map((t) => t.value) as [Tier, ...Tier[]];

export function tierLabel(tier: Tier): string {
  return TIERS.find((t) => t.value === tier)?.label ?? tier;
}
