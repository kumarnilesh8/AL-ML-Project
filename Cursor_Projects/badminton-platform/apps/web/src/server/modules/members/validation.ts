import { TIER_VALUES } from '@bp/domain';
import { z } from 'zod';

const emailSchema = z.email();

/** Splits a pasted list (commas, spaces, new lines, semicolons) into valid and invalid addresses. */
export function parseEmailList(text: string, max = 50): { valid: string[]; invalid: string[]; tooMany: boolean } {
  const parts = text
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(parts)];
  const valid = unique.filter((e) => emailSchema.safeParse(e).success);
  const invalid = unique.filter((e) => !emailSchema.safeParse(e).success);
  return { valid: valid.slice(0, max), invalid, tooMany: valid.length > max };
}

export const guestSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(60, 'Use at most 60 characters'),
  lastName: z.string().trim().max(60, 'Use at most 60 characters').default(''),
  tier: z.enum(TIER_VALUES, { message: 'Choose a level' }),
});
export type GuestInput = z.infer<typeof guestSchema>;

export const roleSchema = z.enum(['owner', 'admin', 'organiser', 'player']);

export const JOIN_CODE = /^[a-z0-9]{8,16}$/;
export const INVITE_DAYS = 14;
