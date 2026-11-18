import { describe, expect, it } from 'vitest';
import { DEFAULT_SCORING, validateScore } from '../src/index';

describe('validateScore (single game to 21, cap 30, win by 2)', () => {
  const ok = (a: number, b: number) => validateScore(DEFAULT_SCORING, a, b).ok;

  it.each([
    [21, 0], [21, 19], [19, 21], [22, 20], [29, 27], [30, 28], [30, 29], [29, 30],
  ])('accepts %i-%i', (a, b) => expect(ok(a, b)).toBe(true));

  it.each([
    [21, 20, 'MARGIN_TOO_SMALL'],
    [21, 21, 'DRAW'],
    [20, 18, 'WINNER_BELOW_TARGET'],
    [25, 20, 'GAME_SHOULD_HAVE_ENDED'],
    [23, 20, 'GAME_SHOULD_HAVE_ENDED'],
    [31, 29, 'ABOVE_CAP'],
    [30, 27, 'GAME_SHOULD_HAVE_ENDED'],
    [-1, 21, 'NEGATIVE'],
    [21.5, 3, 'NOT_INTEGERS'],
  ] as const)('rejects %s-%s with %s', (a, b, reason) => {
    const r = validateScore(DEFAULT_SCORING, a, b);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });

  it('reports the winning team', () => {
    expect(validateScore(DEFAULT_SCORING, 18, 21)).toEqual({ ok: true, winner: 'B' });
  });

  it('supports first-to-target games without win-by-two', () => {
    const rules = { pointsToWin: 15, cap: 15, winByTwo: false };
    expect(validateScore(rules, 15, 14).ok).toBe(true);
    expect(validateScore(rules, 16, 14).ok).toBe(false);
  });
});
