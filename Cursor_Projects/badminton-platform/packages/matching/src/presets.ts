import type { MatchingPreset } from '@bp/domain';
import type { CostWeights } from './types';

/** Preset weights (rating-and-matching.md §B5). Court-time fairness is identical in all presets. */
export const PRESETS: Record<MatchingPreset, CostWeights> = {
  social: { rangeTolerance: 600, balance: 1.0, range: 0.5, partner: 3.0, opponent: 1.0, lowConfidence: 0.5 },
  balanced: { rangeTolerance: 400, balance: 2.0, range: 1.0, partner: 2.0, opponent: 0.7, lowConfidence: 1.0 },
  competitive: { rangeTolerance: 250, balance: 3.0, range: 2.0, partner: 1.0, opponent: 0.4, lowConfidence: 1.0 },
};

export const MATCHING_ENGINE_VERSION = 'matching-1.0.0';
