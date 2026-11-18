import { describe, expect, it } from 'vitest';
import { DEFAULT_RATING_CONFIG, explainChange, rateMatch } from '../src/index';
import { changeOf, doubles, player, states } from './helpers';

/** rating-and-matching.md §A6 — values verified independently; tolerance ±0.1. */
describe('worked examples (§A6)', () => {
  it('Example 1: mixed-confidence team wins a close game', () => {
    const s = states(player('Sam', 1300, 80), player('Jo', 1100, 300), player('B1', 1250, 80), player('B2', 1250, 80));
    const r = rateMatch(s, doubles('m1', ['Sam', 'Jo'], ['B1', 'B2'], 21, 18));
    expect(r.changes[0]!.expected).toBeCloseTo(0.429, 2);
    expect(r.changes[0]!.actual).toBeCloseTo(0.885, 3);
    expect(changeOf(r.changes, 'Sam')).toBeCloseTo(8.5, 1);
    expect(changeOf(r.changes, 'Jo')).toBeCloseTo(24.5, 1);
    expect(changeOf(r.changes, 'B1')).toBeCloseTo(-6.4, 1);
    expect(changeOf(r.changes, 'B2')).toBeCloseTo(-6.4, 1);
  });

  const strong = () => states(player('A1', 1500, 70), player('A2', 1500, 70), player('B1', 1100, 70), player('B2', 1100, 70));

  it('Example 2: an expected blowout changes almost nothing', () => {
    const r = rateMatch(strong(), doubles('m2', ['A1', 'A2'], ['B1', 'B2'], 21, 9));
    expect(r.changes[0]!.expected).toBeCloseTo(0.909, 3);
    expect(changeOf(r.changes, 'A1')).toBeCloseTo(0.3, 1);
    expect(changeOf(r.changes, 'B1')).toBeCloseTo(-0.3, 1);
  });

  it('Example 3: favourite scrapes a win — guardrail B', () => {
    const r = rateMatch(strong(), doubles('m3', ['A1', 'A2'], ['B1', 'B2'], 21, 19));
    expect(changeOf(r.changes, 'A1')).toBe(0);
    expect(r.changes.find((c) => c.playerId === 'A1')!.guardrailApplied).toBe(true);
    expect(changeOf(r.changes, 'B1')).toBeCloseTo(0.5, 1);
  });

  it('Example 3: pure maths without guardrail', () => {
    const r = rateMatch(strong(), doubles('m3', ['A1', 'A2'], ['B1', 'B2'], 21, 19), { ...DEFAULT_RATING_CONFIG, guardrail: 'none' });
    expect(changeOf(r.changes, 'A1')).toBeCloseTo(-0.5, 1);
    expect(changeOf(r.changes, 'B1')).toBeCloseTo(0.5, 1);
  });

  it('Example 4: upset', () => {
    const s = states(player('A1', 1100, 70), player('A2', 1100, 70), player('B1', 1500, 70), player('B2', 1500, 70));
    const r = rateMatch(s, doubles('m4', ['A1', 'A2'], ['B1', 'B2'], 21, 17));
    expect(changeOf(r.changes, 'A1')).toBeCloseTo(13.8, 1);
    expect(changeOf(r.changes, 'B1')).toBeCloseTo(-13.8, 1);
  });

  it('explains a change in plain language', () => {
    const s = states(player('Sam', 1300, 80), player('Jo', 1100, 300), player('B1', 1250, 80), player('B2', 1250, 80));
    const r = rateMatch(s, doubles('m1', ['Sam', 'Jo'], ['B1', 'B2'], 21, 18));
    const text = explainChange(r.changes.find((c) => c.playerId === 'Jo')!);
    expect(text).toContain('expected share 43%');
    expect(text).toContain('You won');
    expect(text).toContain('low confidence');
    expect(text).toContain('+24.5');
  });
});
