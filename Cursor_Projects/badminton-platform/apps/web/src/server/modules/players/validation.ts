import { TIER_VALUES } from '@bp/domain';
import { z } from 'zod';

/** Profile form for a player's own account (adults). */
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(60, 'Use at most 60 characters'),
  lastName: z.string().trim().max(60, 'Use at most 60 characters').default(''),
  tier: z.enum(TIER_VALUES, { message: 'Choose the level that fits you best' }),
  agree: z.literal('on', { message: 'Please accept the privacy notice and terms to continue' }),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function displayNameOf(firstName: string, lastName: string): string {
  const initial = lastName.trim() ? ` ${lastName.trim()[0]!.toUpperCase()}.` : '';
  return `${firstName.trim()}${initial}`;
}

export const CONSENT_VERSION = '2026-10-draft';
