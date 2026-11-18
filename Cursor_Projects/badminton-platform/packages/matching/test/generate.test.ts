import { describe, expect, it } from 'vitest';
import { buildHistory, generateRound, lateArrivalCredit } from '../src/index';
import { courts, mp, pool } from './helpers';

function ok(res: ReturnType<typeof generateRound>) {
  if (!res.ok) throw new Error(`${res.error}: ${res.message}`);
  return res;
}
const playersIn = (r: ReturnType<typeof ok>) => r.matches.flatMap((m) => [...m.teamA, ...m.teamB]);

describe('generateRound: basics', () => {
  it('fills min(courts, floor(players/4)) courts with 2 v 2 matches', () => {
    const r = ok(generateRound({ players: pool(10), courtIds: courts(3), preset: 'balanced', seed: 1 }));
    expect(r.matches).toHaveLength(2);
    expect(r.sitOuts).toHaveLength(2);
    for (const m of r.matches) {
      expect(m.teamA).toHaveLength(2);
      expect(m.teamB).toHaveLength(2);
    }
    const ids = [...playersIn(r), ...r.sitOuts.map((s) => s.playerId)];
    expect(new Set(ids).size).toBe(10);
  });

  it('reports how many more players are needed', () => {
    const r = generateRound({ players: pool(3), courtIds: courts(2), preset: 'balanced', seed: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('NOT_ENOUGH_PLAYERS');
      expect(r.playersNeeded).toBe(1);
    }
  });

  it('requires at least one court', () => {
    const r = generateRound({ players: pool(8), courtIds: [], preset: 'balanced', seed: 1 });
    expect(r.ok).toBe(false);
  });

  it('is deterministic for the same seed', () => {
    const input = { players: pool(18), courtIds: courts(4), preset: 'balanced' as const, seed: 99 };
    expect(generateRound(input)).toEqual(generateRound(input));
  });

  it('produces balanced matches for an even spread of levels', () => {
    const r = ok(generateRound({ players: pool(16), courtIds: courts(4), preset: 'balanced', seed: 3 }));
    for (const m of r.matches) {
      expect(m.predictedA).toBeGreaterThan(0.35);
      expect(m.predictedA).toBeLessThan(0.65);
    }
  });

  it('explains every match', () => {
    const r = ok(generateRound({ players: pool(8), courtIds: courts(2), preset: 'balanced', seed: 3 }));
    for (const m of r.matches) {
      expect(m.explanation.lines.length).toBeGreaterThanOrEqual(3);
      expect(m.explanation.lines.join(' ')).toMatch(/Predicted: \d+% \/ \d+%/);
    }
  });
});

describe('generateRound: fairness of sit-outs', () => {
  it('sits out players who have played most', () => {
    const players = pool(9).map((p, i) => ({ ...p, gamesPlayed: i === 4 ? 3 : 2 }));
    const r = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed: 5 }));
    expect(r.sitOuts.map((s) => s.playerId)).toEqual(['p05']);
    expect(r.sitOuts[0]!.reason).toBe('most_games');
  });

  it('never sits out a player twice in a row when avoidable', () => {
    const players = pool(10).map((p) => ({ ...p, gamesPlayed: 2 }));
    players[0]!.satOutLastRound = true;
    players[1]!.satOutLastRound = true;
    players[0]!.gamesPlayed = 9; // even with most games, protection wins
    for (let seed = 0; seed < 30; seed++) {
      const r = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed }));
      const out = r.sitOuts.map((s) => s.playerId);
      expect(out).not.toContain('p01');
      expect(out).not.toContain('p02');
    }
  });

  it('a late arrival is credited with the floor of the average games played', () => {
    expect(lateArrivalCredit([3, 3, 4, 2])).toBe(3);
    expect(lateArrivalCredit([])).toBe(0);
  });
});

describe('generateRound: variety', () => {
  it('avoids repeating last round partnerships when alternatives exist', () => {
    const players = pool(8);
    const first = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed: 11 }));
    const history = buildHistory(first.matches.map((m) => ({ teamA: m.teamA, teamB: m.teamB, scope: 'session' as const })));
    const second = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed: 12, history }));
    expect(second.quality.repeatPartnerships).toBe(0);
  });
});

describe('generateRound: fixed partners and locks', () => {
  it('keeps fixed partners on the same team, sitting out together', () => {
    const players = pool(10);
    for (let seed = 0; seed < 25; seed++) {
      const r = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed, fixedPairs: [{ a: 'p01', b: 'p10' }] }));
      const out = r.sitOuts.map((s) => s.playerId);
      if (out.includes('p01') || out.includes('p10')) {
        expect(out).toContain('p01');
        expect(out).toContain('p10');
      } else {
        const team = r.matches.flatMap((m) => [m.teamA, m.teamB]).find((t) => t.includes('p01'))!;
        expect(team).toContain('p10');
      }
    }
  });

  it('does not penalise fixed partners for playing together again', () => {
    const players = pool(8);
    const history = buildHistory([{ teamA: ['p01', 'p08'], teamB: ['p02', 'p03'], scope: 'session' }]);
    const r = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed: 2, history, fixedPairs: [{ a: 'p01', b: 'p08' }] }));
    expect(r.quality.repeatPartnerships).toBe(1); // reported, but not avoided at any cost
  });

  it('respects court and team locks', () => {
    const players = pool(12);
    const r = ok(
      generateRound({
        players,
        courtIds: courts(3),
        preset: 'balanced',
        seed: 4,
        locks: [
          { playerId: 'p05', courtId: 'court-3', team: 'B' },
          { playerId: 'p06', courtId: 'court-3' },
        ],
      }),
    );
    const c3 = r.matches.find((m) => m.courtId === 'court-3')!;
    expect(c3.teamB).toContain('p05');
    expect([...c3.teamA, ...c3.teamB]).toContain('p06');
  });

  it('rejects contradictory locks', () => {
    const r = generateRound({
      players: pool(8),
      courtIds: courts(2),
      preset: 'balanced',
      seed: 1,
      fixedPairs: [{ a: 'p01', b: 'p02' }],
      locks: [
        { playerId: 'p01', courtId: 'court-1' },
        { playerId: 'p02', courtId: 'court-2' },
      ],
    });
    expect(r.ok).toBe(false);
  });
});

describe('generateRound: low-confidence players', () => {
  it('flags them in the explanation', () => {
    const players = pool(8);
    players[3] = mp('new', 1300, { deviation: 300 });
    const r = ok(generateRound({ players, courtIds: courts(2), preset: 'balanced', seed: 8 }));
    const m = r.matches.find((x) => [...x.teamA, ...x.teamB].includes('new'))!;
    expect(m.explanation.lowConfidencePlayers).toEqual(['new']);
  });
});

describe('generateRound: performance', () => {
  it('handles 60 players on 12 courts quickly', () => {
    const players = pool(60);
    const t = performance.now();
    const r = ok(generateRound({ players, courtIds: courts(12), preset: 'balanced', seed: 1 }));
    const ms = performance.now() - t;
    expect(r.matches).toHaveLength(12);
    expect(ms).toBeLessThan(1000); // target < 300 ms on a normal laptop; generous limit for CI
  });
});
