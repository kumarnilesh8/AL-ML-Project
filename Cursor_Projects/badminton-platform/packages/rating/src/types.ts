import type { PlayerId, ResultKind, StartSource } from '@bp/domain';

/** Current rating state of one player in one club and format. */
export interface PlayerRating {
  playerId: PlayerId;
  rating: number;
  deviation: number;
  matchesCounted: number;
  /** Milliseconds since epoch of the last rated match, if any. */
  lastPlayedAt: number | null;
  /** Most recent surprises (S − E), newest last, at most `surpriseWindow` long. */
  recentSurprises: number[];
  startSource: StartSource;
}

/** A confirmed match to be rated (doubles: 2 v 2; the model also supports 1 v 1). */
export interface RatedMatchInput {
  matchId: string;
  teamA: PlayerId[];
  teamB: PlayerId[];
  pointsA: number;
  pointsB: number;
  /** Milliseconds since epoch when the match was played. */
  playedAt: number;
  resultKind: ResultKind;
}

/** The full explanation of one player's rating change (stored as a rating_changes row). */
export interface RatingChange {
  matchId: string;
  playerId: PlayerId;
  team: 'A' | 'B';
  won: boolean;
  ratingBefore: number;
  ratingAfter: number;
  deviationBefore: number;
  deviationAfter: number;
  /** Deviation after inactivity growth, before this match. */
  deviationAtStart: number;
  teamRating: number;
  opponentRating: number;
  expected: number;
  actual: number;
  k: number;
  opponentConfidence: number;
  weight: number;
  rawChange: number;
  change: number;
  guardrailApplied: boolean;
  adaptiveTriggered: boolean;
  /** True when the organiser should be prompted to review this player's level. */
  reviewSuggested: boolean;
  engineVersion: string;
}

export interface RateMatchResult {
  /** False when the match does not affect ratings (e.g. retired through injury). */
  rated: boolean;
  changes: RatingChange[];
  updated: PlayerRating[];
}
