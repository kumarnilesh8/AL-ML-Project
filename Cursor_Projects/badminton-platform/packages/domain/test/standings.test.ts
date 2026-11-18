import { describe, expect, it } from 'vitest';
import { computeStandings, type PlayerGame } from '../src/index';

/** Builds games with a given total points difference spread evenly. */
function games(n: number, wins: number, totalDiff: number): PlayerGame[] {
  const out: PlayerGame[] = [];
  for (let i = 0; i < n; i++) out.push({ won: i < wins, pointsFor: 0, pointsAgainst: 0 });
  // Put the whole difference on the first game; only the total matters.
  out[0]!.pointsFor = Math.max(totalDiff, 0);
  out[0]!.pointsAgainst = Math.max(-totalDiff, 0);
  return out;
}

describe('computeStandings (rating-and-matching.md Part E5 example)', () => {
  const inputs = [
    { playerId: 'Aisha', games: games(5, 4, 21) }, // +4.2 avg
    { playerId: 'Omar', games: games(6, 4, 18) }, // +3.0
    { playerId: 'Priya', games: games(6, 4, 9) }, // +1.5
    { playerId: 'Ben', games: games(5, 2, -10) }, // -2.0
    { playerId: 'Sara', games: games(1, 1, 6) }, // left early
  ];
  const res = computeStandings(inputs, { method: 'win_pct', minGames: 3 });

  it('ranks by win %, then average points difference', () => {
    expect(res.ranked.map((r) => [r.playerId, r.rank])).toEqual([
      ['Aisha', 1],
      ['Omar', 2],
      ['Priya', 3],
      ['Ben', 4],
    ]);
  });

  it('lists players below the minimum as "Not enough games"', () => {
    expect(res.notEnoughGames.map((r) => r.playerId)).toEqual(['Sara']);
    expect(res.notEnoughGames[0]!.rank).toBeNull();
    expect(res.qualificationThreshold).toBe(3);
  });

  it('shares positions for exact ties', () => {
    const tie = computeStandings(
      [
        { playerId: 'a', games: games(4, 2, 0) },
        { playerId: 'b', games: games(4, 2, 0) },
        { playerId: 'c', games: games(4, 1, 0) },
      ],
      { method: 'win_pct', minGames: 1 },
    );
    expect(tie.ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it('uses half the session average when that is higher than the minimum', () => {
    const r = computeStandings(
      [
        { playerId: 'a', games: games(10, 5, 0) },
        { playerId: 'b', games: games(10, 5, 0) },
        { playerId: 'c', games: games(4, 4, 0) },
      ],
      { method: 'win_pct', minGames: 1 },
    );
    expect(r.qualificationThreshold).toBe(4);
    expect(r.ranked.map((x) => x.playerId)).toContain('c');
  });

  it('can rank by most wins instead', () => {
    const r = computeStandings(
      [
        { playerId: 'many', games: games(8, 5, 0) },
        { playerId: 'few', games: games(4, 4, 0) },
      ],
      { method: 'most_wins', minGames: 1 },
    );
    expect(r.ranked[0]!.playerId).toBe('many');
  });
});
