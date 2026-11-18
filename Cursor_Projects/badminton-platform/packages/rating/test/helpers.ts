import type { PlayerRating, RatedMatchInput } from '../src/index';

export const T0 = Date.UTC(2026, 9, 1, 18, 0, 0);

export function player(id: string, rating: number, deviation: number, extra: Partial<PlayerRating> = {}): PlayerRating {
  return {
    playerId: id,
    rating,
    deviation,
    matchesCounted: 20,
    lastPlayedAt: null,
    recentSurprises: [],
    startSource: 'organiser',
    ...extra,
  };
}

export function states(...ps: PlayerRating[]): Map<string, PlayerRating> {
  return new Map(ps.map((p) => [p.playerId, p]));
}

export function doubles(
  id: string,
  teamA: [string, string],
  teamB: [string, string],
  pointsA: number,
  pointsB: number,
  playedAt = T0,
  resultKind: RatedMatchInput['resultKind'] = 'finished',
): RatedMatchInput {
  return { matchId: id, teamA, teamB, pointsA, pointsB, playedAt, resultKind };
}

export function changeOf(changes: { playerId: string; change: number }[], id: string): number {
  const c = changes.find((x) => x.playerId === id);
  if (!c) throw new Error(`no change for ${id}`);
  return c.change;
}
