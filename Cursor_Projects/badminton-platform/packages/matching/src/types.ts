import type { MatchingPreset, PlayerId, Team } from '@bp/domain';

/** A checked-in, available player as seen by the round generator. */
export interface MatchingPlayer {
  id: PlayerId;
  rating: number;
  deviation: number;
  /** Games played this session (late arrivals credited, see lateArrivalCredit). */
  gamesPlayed: number;
  /** Rounds sat out this session. */
  sitOutsTotal: number;
  /** True if the player sat out the previous round (protected from sitting out again). */
  satOutLastRound: boolean;
}

export interface PairCounts {
  /** Times together this session. */
  session: number;
  /** Times together in the player's last 3 sessions at the club. */
  recent: number;
}

export interface MatchingHistory {
  /** Keyed by pairKey(a, b). */
  partners: Map<string, PairCounts>;
  opponents: Map<string, PairCounts>;
}

export interface FixedPair {
  a: PlayerId;
  b: PlayerId;
}

/** Organiser lock: keep a player on a court (and optionally on a team side). */
export interface PlacementLock {
  playerId: PlayerId;
  courtId: string;
  team?: Team;
}

export interface CostWeights {
  balance: number;
  range: number;
  partner: number;
  opponent: number;
  lowConfidence: number;
  /** Skill range tolerance T (rating points). */
  rangeTolerance: number;
}

export interface GenerateRoundInput {
  players: MatchingPlayer[];
  /** Active courts in display order. */
  courtIds: string[];
  preset: MatchingPreset;
  seed: number;
  history?: MatchingHistory;
  fixedPairs?: FixedPair[];
  locks?: PlacementLock[];
  /** Optimisation iterations (default scales with courts; deterministic for a given seed). */
  iterations?: number;
  /** Override preset weights (testing/tuning). */
  weights?: Partial<CostWeights>;
  /** Uncertainty at or above which a player counts as low confidence. */
  lowConfidenceAt?: number;
}

export interface SelectionNote {
  playerId: PlayerId;
  reason: string;
}

export interface RepeatNote {
  type: 'partner' | 'opponent';
  players: [PlayerId, PlayerId];
  timesThisSession: number;
  timesRecently: number;
}

export interface MatchExplanation {
  selected: SelectionNote[];
  teamARating: number;
  teamBRating: number;
  predictedA: number;
  predictedB: number;
  repeats: RepeatNote[];
  lowConfidencePlayers: PlayerId[];
  /** Human-readable lines for the "Why this game?" panel. */
  lines: string[];
}

export interface GeneratedMatch {
  courtId: string;
  teamA: [PlayerId, PlayerId];
  teamB: [PlayerId, PlayerId];
  predictedA: number;
  cost: number;
  explanation: MatchExplanation;
}

export type SitOutReason = 'most_games' | 'fewest_sit_outs' | 'tie_break' | 'repeat_unavoidable';

export interface SitOut {
  playerId: PlayerId;
  reason: SitOutReason;
  text: string;
}

export interface RoundQuality {
  totalCost: number;
  closeMatches: number; // predicted share between 35% and 65%
  repeatPartnerships: number; // partnerships already seen this session
  repeatOpponents: number;
  maxRatingRange: number;
}

export type GenerateRoundResult =
  | {
      ok: true;
      matches: GeneratedMatch[];
      sitOuts: SitOut[];
      quality: RoundQuality;
      seed: number;
      iterations: number;
      engineVersion: string;
    }
  | { ok: false; error: GenerateError; message: string; playersNeeded?: number };

export type GenerateError = 'NOT_ENOUGH_PLAYERS' | 'NO_COURTS' | 'INVALID_INPUT' | 'LOCKS_CONFLICT';
