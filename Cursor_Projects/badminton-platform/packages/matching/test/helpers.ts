import type { MatchingPlayer } from '../src/index';

export function mp(id: string, rating: number, extra: Partial<MatchingPlayer> = {}): MatchingPlayer {
  return { id, rating, deviation: 80, gamesPlayed: 0, sitOutsTotal: 0, satOutLastRound: false, ...extra };
}

/** n players with ratings spread from 900 to 1700. */
export function pool(n: number, extra: Partial<MatchingPlayer> = {}): MatchingPlayer[] {
  return Array.from({ length: n }, (_, i) => mp(`p${String(i + 1).padStart(2, '0')}`, 900 + Math.round((800 * i) / Math.max(1, n - 1)), extra));
}

export const courts = (n: number) => Array.from({ length: n }, (_, i) => `court-${i + 1}`);
