import { pairKey, type PlayerId } from '@bp/domain';
import type { MatchingHistory, PairCounts } from './types';

export interface PastMatch {
  teamA: PlayerId[];
  teamB: PlayerId[];
  /** 'session' = earlier in this session; 'recent' = one of the last 3 sessions. */
  scope: 'session' | 'recent';
}

export function emptyHistory(): MatchingHistory {
  return { partners: new Map(), opponents: new Map() };
}

function bump(map: Map<string, PairCounts>, key: string, scope: 'session' | 'recent') {
  const c = map.get(key) ?? { session: 0, recent: 0 };
  c[scope] += 1;
  map.set(key, c);
}

/** Builds partner/opponent counts from past matches (published rounds count, whatever the result). */
export function buildHistory(matches: PastMatch[]): MatchingHistory {
  const h = emptyHistory();
  for (const m of matches) {
    for (const team of [m.teamA, m.teamB]) {
      for (let i = 0; i < team.length; i++)
        for (let j = i + 1; j < team.length; j++) bump(h.partners, pairKey(team[i]!, team[j]!), m.scope);
    }
    for (const a of m.teamA) for (const b of m.teamB) bump(h.opponents, pairKey(a, b), m.scope);
  }
  return h;
}

/**
 * Games credited to a late arrival: floor(average games played by the others),
 * so they neither jump the queue for the rest of the session nor wait unfairly.
 */
export function lateArrivalCredit(gamesPlayedByOthers: number[]): number {
  if (gamesPlayedByOthers.length === 0) return 0;
  return Math.floor(gamesPlayedByOthers.reduce((s, g) => s + g, 0) / gamesPlayedByOthers.length);
}
