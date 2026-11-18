import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { generateRound, type MatchingPlayer } from '../src/index';
import { courts } from './helpers';

const playersArb = fc
  .array(
    fc.record({
      rating: fc.integer({ min: 600, max: 2000 }),
      deviation: fc.integer({ min: 60, max: 350 }),
      gamesPlayed: fc.integer({ min: 0, max: 8 }),
      sitOutsTotal: fc.integer({ min: 0, max: 3 }),
      satOutLastRound: fc.boolean(),
    }),
    { minLength: 4, maxLength: 40 },
  )
  .map((rows) => rows.map((r, i): MatchingPlayer => ({ id: `p${i}`, ...r })));

describe('round generator invariants (§D3)', () => {
  it('no player appears twice; everyone plays or sits out; teams are 2 v 2', () => {
    fc.assert(
      fc.property(playersArb, fc.integer({ min: 1, max: 10 }), fc.integer(), (players, c, seed) => {
        const r = generateRound({ players, courtIds: courts(c), preset: 'balanced', seed, iterations: 400 });
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        const onCourt = r.matches.flatMap((m) => [...m.teamA, ...m.teamB]);
        expect(new Set(onCourt).size).toBe(onCourt.length);
        expect(onCourt.length).toBe(4 * Math.min(c, Math.floor(players.length / 4)));
        const all = [...onCourt, ...r.sitOuts.map((s) => s.playerId)].sort();
        expect(all).toEqual(players.map((p) => p.id).sort());
      }),
      { numRuns: 150 },
    );
  });

  it('players who sat out last round are protected whenever arithmetically possible', () => {
    fc.assert(
      fc.property(playersArb, fc.integer({ min: 1, max: 10 }), fc.integer(), (players, c, seed) => {
        const r = generateRound({ players, courtIds: courts(c), preset: 'social', seed, iterations: 300 });
        if (!r.ok) return;
        const places = r.matches.length * 4;
        const protectedCount = players.filter((p) => p.satOutLastRound).length;
        if (protectedCount <= places) {
          for (const s of r.sitOuts) expect(players.find((p) => p.id === s.playerId)!.satOutLastRound).toBe(false);
        }
      }),
      { numRuns: 150 },
    );
  });

  it('court time is fair: unprotected players sitting out have played at least as many games as anyone playing', () => {
    fc.assert(
      fc.property(playersArb, fc.integer({ min: 1, max: 10 }), fc.integer(), (players, c, seed) => {
        const r = generateRound({ players, courtIds: courts(c), preset: 'competitive', seed, iterations: 300 });
        if (!r.ok) return;
        const get = (id: string) => players.find((p) => p.id === id)!;
        const playing = r.matches.flatMap((m) => [...m.teamA, ...m.teamB]).map(get).filter((p) => !p.satOutLastRound);
        const sitting = r.sitOuts.map((s) => get(s.playerId)).filter((p) => !p.satOutLastRound);
        if (!playing.length || !sitting.length) return;
        expect(Math.min(...sitting.map((p) => p.gamesPlayed))).toBeGreaterThanOrEqual(Math.max(...playing.map((p) => p.gamesPlayed)));
      }),
      { numRuns: 150 },
    );
  });

  it('is deterministic', () => {
    fc.assert(
      fc.property(playersArb, fc.integer({ min: 1, max: 6 }), fc.integer(), (players, c, seed) => {
        const a = generateRound({ players, courtIds: courts(c), preset: 'balanced', seed, iterations: 300 });
        const b = generateRound({ players, courtIds: courts(c), preset: 'balanced', seed, iterations: 300 });
        expect(a).toEqual(b);
      }),
      { numRuns: 60 },
    );
  });
});
