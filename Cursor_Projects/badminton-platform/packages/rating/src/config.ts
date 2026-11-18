import type { StartSource, Tier } from '@bp/domain';

/**
 * Rating constants (rating-and-matching.md §A4). Starting defaults, to be tuned with pilot data.
 */
export interface RatingConfig {
  dMin: number;
  dMax: number;
  kMin: number;
  kMax: number;
  /** Uncertainty multiplier after each rated match. */
  shrink: number;
  /** Weight of win/loss vs points share (1.0 = results only). */
  marginWeight: number;
  /** Uncertainty growth per week of inactivity. */
  inactivityPerWeek: number;
  /** Logistic scale (Elo convention). */
  scale: number;
  /** 'B' = a win never lowers a rating; 'none' = pure maths. */
  guardrail: 'B' | 'none';
  /**
   * Adaptive confidence check (§A5a).
   * 'window': average surprise over the last `surpriseWindow` matches ≥ `surpriseThreshold` (spec v1.2).
   * 'zscore': sum of surprises over the last `surpriseWindow` matches, divided by the expected noise,
   *           is at least `zThreshold` in size, after at least `zMinMatches` matches.
   */
  adaptiveMode: 'window' | 'zscore' | 'off';
  surpriseWindow: number;
  surpriseThreshold: number;
  zThreshold: number;
  zMinMatches: number;
  /** Typical spread of one game's performance around expectation (with marginWeight 0.75). */
  perMatchNoise: number;
  adaptiveGrowth: number;
  /** Confidence badge thresholds. */
  lowConfidenceAt: number;
  mediumConfidenceAt: number;
  /** Step-size multiplier for games stopped because time ran out. */
  unfinishedWeight: number;
  /**
   * How a team's surprise is shared between partners.
   * 'equal'       – each partner moves by their own step size (spec v1.2).
   * 'uncertainty' – partners share the team's movement in proportion to their uncertainty²,
   *                 so a new player teamed with an established one carries most of the change.
   */
  sharing: 'equal' | 'uncertainty';
}

export const DEFAULT_RATING_CONFIG: RatingConfig = {
  dMin: 60,
  dMax: 350,
  kMin: 16,
  kMax: 64,
  shrink: 0.92,
  marginWeight: 0.75,
  inactivityPerWeek: 20,
  scale: 400,
  guardrail: 'B',
  adaptiveMode: 'zscore',
  surpriseWindow: 20,
  surpriseThreshold: 0.15,
  zThreshold: 2.2,
  zMinMatches: 8,
  perMatchNoise: 0.38,
  adaptiveGrowth: 1.05,
  lowConfidenceAt: 150,
  mediumConfidenceAt: 90,
  unfinishedWeight: 0.5,
  sharing: 'equal',
};

export const ENGINE_VERSION = 'rating-1.1.0';

/** Starting ratings per plain-language tier (§A3). */
export const TIER_RATINGS: Record<Tier, number> = {
  new: 700,
  beginner: 900,
  improver: 1100,
  intermediate: 1300,
  advanced: 1500,
  competitive: 1700,
};

/** Starting uncertainty by how the starting tier was decided (§A3). */
export const START_DEVIATION: Record<StartSource, number> = {
  unknown: 350,
  self: 300,
  organiser: 220,
  external: 180,
};

export const TIER_ORDER: Tier[] = ['new', 'beginner', 'improver', 'intermediate', 'advanced', 'competitive'];
