import type { Team } from './types';

/**
 * Scoring rules for a single-game match (each match is one game).
 * Defaults: game to 21, capped at 30, win by two.
 */
export interface ScoringRules {
  pointsToWin: number;
  cap: number;
  winByTwo: boolean;
}

export const DEFAULT_SCORING: ScoringRules = { pointsToWin: 21, cap: 30, winByTwo: true };

export type ScoreValidation =
  | { ok: true; winner: Team }
  | { ok: false; reason: ScoreError };

export type ScoreError =
  | 'NOT_INTEGERS'
  | 'NEGATIVE'
  | 'DRAW'
  | 'WINNER_BELOW_TARGET'
  | 'ABOVE_CAP'
  | 'MARGIN_TOO_SMALL'
  | 'GAME_SHOULD_HAVE_ENDED'
  | 'INVALID_RULES';

export function validateRules(rules: ScoringRules): boolean {
  return (
    Number.isInteger(rules.pointsToWin) &&
    Number.isInteger(rules.cap) &&
    rules.pointsToWin >= 11 &&
    rules.pointsToWin <= 31 &&
    rules.cap >= rules.pointsToWin &&
    rules.cap <= 50
  );
}

/**
 * Validates the final score of one finished game.
 * Examples with defaults: 21-19 ✔, 22-20 ✔, 30-29 ✔, 21-20 ✘, 25-20 ✘.
 */
export function validateScore(rules: ScoringRules, pointsA: number, pointsB: number): ScoreValidation {
  if (!validateRules(rules)) return { ok: false, reason: 'INVALID_RULES' };
  if (!Number.isInteger(pointsA) || !Number.isInteger(pointsB)) return { ok: false, reason: 'NOT_INTEGERS' };
  if (pointsA < 0 || pointsB < 0) return { ok: false, reason: 'NEGATIVE' };
  if (pointsA === pointsB) return { ok: false, reason: 'DRAW' };

  const winner: Team = pointsA > pointsB ? 'A' : 'B';
  const w = Math.max(pointsA, pointsB);
  const l = Math.min(pointsA, pointsB);
  const { pointsToWin: t, cap, winByTwo } = rules;

  if (w < t) return { ok: false, reason: 'WINNER_BELOW_TARGET' };
  if (w > cap) return { ok: false, reason: 'ABOVE_CAP' };

  if (!winByTwo || t === cap) {
    // First to the target wins.
    if (w !== t) return { ok: false, reason: 'GAME_SHOULD_HAVE_ENDED' };
    return { ok: true, winner };
  }

  if (w === t) {
    // Reached the target without extension: loser must be at least 2 behind.
    if (l > t - 2) return { ok: false, reason: 'MARGIN_TOO_SMALL' };
    return { ok: true, winner };
  }

  // Extended game (w > t).
  if (w === cap) {
    // At the cap, the next point wins: cap-(cap-1) or cap-(cap-2).
    if (l === cap - 1 || l === cap - 2) return { ok: true, winner };
    return { ok: false, reason: 'GAME_SHOULD_HAVE_ENDED' };
  }
  if (w - l !== 2) return { ok: false, reason: w - l < 2 ? 'MARGIN_TOO_SMALL' : 'GAME_SHOULD_HAVE_ENDED' };
  return { ok: true, winner };
}
