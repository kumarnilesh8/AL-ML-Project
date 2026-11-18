import { TIER_VALUES } from '@bp/domain';
import { z } from 'zod';

export const childSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your child’s first name').max(60, 'Use at most 60 characters'),
  lastName: z.string().trim().max(60, 'Use at most 60 characters').default(''),
  ageBand: z.enum(['under_14', '14_17'], { message: 'Choose an age band' }),
  tier: z.enum(TIER_VALUES, { message: 'Choose a level' }),
  consent: z.literal('on', { message: 'As the parent or guardian, please confirm your consent' }),
});
export type ChildInput = z.infer<typeof childSchema>;

export const AGE_BAND_LABELS = { adult: 'Adult', '14_17': '14–17', under_14: 'Under 14' } as const;
