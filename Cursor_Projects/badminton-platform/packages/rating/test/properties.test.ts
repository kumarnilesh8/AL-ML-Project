import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DEFAULT_RATING_CONFIG, rateMatch } from '../src/index';
import { T0, doubles, player, states } from './helpers';

const ratingArb = fc.integer({ min: 500, max: 2200 });
const devArb = fc.integer({ min: 60, max: 350 });

/** A valid single-game score to 21 (cap 30). */
const scoreArb = fc
  .tuple(fc.integer({ min: 0, max: 28 }), fc.boolean())
  .map(([loser, aWins]) => {
    const winner = loser <= 19 ? 21 : Math.min(loser + 2, 30);
    return aWins ? [winner, loser] : [loser, winner];
  });

const matchArb = fc.record({
  r: fc.array(ratingArb, { minLength: 4, maxLength: 4 }),
  d: fc.array(devArb, { minLength: 4, maxLength: 4 }),
  score: scoreArb,
});

function run({ r, d, score }: { r: number[]; d: number[]; score: number[] }, cfg = DEFAULT_RATING_CONFIG) {
  const s = states(player('a', r[0]!, d[0]!), player('b', r[1]!, d[1]!), player('c', r[2]!, d[2]!), player('e', r[3]!, d[3]!));
  return rateMatch(s, doubles('m', ['a', 'b'], ['c', 'e'], score[0]!, score[1]!, T0), cfg);
}

describe('rating engine properties (§D3)', () => {
  it('with the guardrail, a winner never loses rating', () => {
    fc.assert(
      fc.property(matchArb, (m) => {
        for (const c of run(m).changes) if (c.won) expect(c.change).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it('is zero-sum when all four players have equal uncertainty and the guardrail does not trigger', () => {
    fc.assert(
      fc.property(fc.array(ratingArb, { minLength: 4, maxLength: 4 }), devArb, scoreArb, (r, d, score) => {
        const res = run({ r, d: [d, d, d, d], score });
        if (res.changes.some((c) => c.guardrailApplied)) return;
        const sum = res.changes.reduce((s, c) => s + c.rawChange, 0);
        expect(Math.abs(sum)).toBeLessThan(0.01);
      }),
    );
  });

  it('a bigger winning margin never gives the winners a smaller change', () => {
    fc.assert(
      fc.property(fc.array(ratingArb, { minLength: 4, maxLength: 4 }), fc.array(devArb, { minLength: 4, maxLength: 4 }), fc.integer({ min: 0, max: 18 }), (r, d, loser) => {
        const narrow = run({ r, d, score: [21, loser + 1] });
        const wide = run({ r, d, score: [21, loser] });
        const a = (x: typeof narrow) => x.changes.find((c) => c.playerId === 'a')!.change;
        expect(a(wide)).toBeGreaterThanOrEqual(a(narrow) - 1e-9);
      }),
    );
  });

  it('is deterministic and always finite', () => {
    fc.assert(
      fc.property(matchArb, (m) => {
        const x = run(m);
        const y = run(m);
        expect(x).toEqual(y);
        for (const c of x.changes) {
          expect(Number.isFinite(c.ratingAfter)).toBe(true);
          expect(c.deviationAfter).toBeGreaterThanOrEqual(60);
          expect(c.deviationAfter).toBeLessThanOrEqual(350);
        }
      }),
    );
  });

  it('partners always receive changes in the same direction', () => {
    fc.assert(
      fc.property(matchArb, (m) => {
        const c = run(m).changes;
        const sign = (x: number) => Math.sign(Math.round(x * 1000));
        const [a, b, cc, e] = ['a', 'b', 'c', 'e'].map((id) => c.find((x) => x.playerId === id)!.change);
        if (sign(a!) !== 0 && sign(b!) !== 0) expect(sign(a!)).toBe(sign(b!));
        if (sign(cc!) !== 0 && sign(e!) !== 0) expect(sign(cc!)).toBe(sign(e!));
      }),
    );
  });
});
