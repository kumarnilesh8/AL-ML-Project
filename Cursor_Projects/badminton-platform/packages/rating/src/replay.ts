import type { PlayerId } from '@bp/domain';
import { DEFAULT_RATING_CONFIG, type RatingConfig } from './config';
import { rateMatch } from './engine';
import type { PlayerRating, RatedMatchInput, RatingChange } from './types';

/** A confirmed match in club play order. */
export interface ReplayMatchEvent {
  kind: 'match';
  playSeq: number;
  match: RatedMatchInput;
}

/** An organiser level review: resets rating and uncertainty from this point in play order. */
export interface ReplayLevelEvent {
  kind: 'level';
  playSeq: number;
  playerId: PlayerId;
  rating: number;
  deviation: number;
}

export type ReplayEvent = ReplayMatchEvent | ReplayLevelEvent;

export interface ReplayResult {
  states: Map<PlayerId, PlayerRating>;
  changes: RatingChange[];
}

/**
 * Deterministically rebuilds ratings from starting states and events in play order
 * (database-design.md §6). Level events at the same playSeq are applied before matches.
 */
export function replay(
  startingStates: Iterable<PlayerRating>,
  events: ReplayEvent[],
  cfg: RatingConfig = DEFAULT_RATING_CONFIG,
): ReplayResult {
  const states = new Map<PlayerId, PlayerRating>();
  for (const s of startingStates) states.set(s.playerId, { ...s, recentSurprises: [...s.recentSurprises] });

  const ordered = [...events].sort((a, b) => {
    if (a.playSeq !== b.playSeq) return a.playSeq - b.playSeq;
    if (a.kind !== b.kind) return a.kind === 'level' ? -1 : 1;
    return 0;
  });

  const changes: RatingChange[] = [];
  for (const ev of ordered) {
    if (ev.kind === 'level') {
      const s = states.get(ev.playerId);
      if (!s) throw new Error(`Level event for unknown player ${ev.playerId}`);
      states.set(ev.playerId, { ...s, rating: ev.rating, deviation: ev.deviation, recentSurprises: [] });
      continue;
    }
    const res = rateMatch(states, ev.match, cfg);
    for (const u of res.updated) states.set(u.playerId, u);
    changes.push(...res.changes);
  }
  return { states, changes };
}
