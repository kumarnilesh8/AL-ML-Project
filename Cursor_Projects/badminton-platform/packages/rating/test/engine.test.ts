import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RATING_CONFIG,
  applyInactivity,
  confidenceOf,
  matchesToMediumConfidence,
  rateMatch,
  replay,
  startingRating,
  type ReplayEvent,
} from '../src/index';
import { T0, changeOf, doubles, player, states } from './helpers';

const WEEK = 7 * 24 * 3600 * 1000;

describe('starting values and confidence', () => {
  it('uses the tier and the source of the assessment', () => {
    expect(startingRating('p', 'self', 'intermediate')).toMatchObject({ rating: 1300, deviation: 300 });
    expect(startingRating('p', 'organiser', 'advanced')).toMatchObject({ rating: 1500, deviation: 220 });
    expect(startingRating('p', 'external', 'competitive')).toMatchObject({ rating: 1700, deviation: 180 });
    expect(startingRating('p', 'unknown', null, 1240)).toMatchObject({ rating: 1240, deviation: 350 });
    expect(startingRating('p', 'unknown', null, null)).toMatchObject({ rating: 1300, deviation: 350 });
  });

  it('maps uncertainty to badges', () => {
    expect(confidenceOf(300)).toBe('low');
    expect(confidenceOf(150)).toBe('low');
    expect(confidenceOf(149)).toBe('medium');
    expect(confidenceOf(90)).toBe('medium');
    expect(confidenceOf(89)).toBe('high');
  });

  it('estimates matches until medium confidence (~9 from self-assessed)', () => {
    expect(matchesToMediumConfidence(300)).toBe(9);
    expect(matchesToMediumConfidence(120)).toBe(0);
  });
});

describe('inactivity', () => {
  it('grows uncertainty but never changes the rating', () => {
    const p = player('p', 1400, 60, { lastPlayedAt: T0 });
    const later = applyInactivity(p, T0 + 26 * WEEK);
    expect(later.rating).toBe(1400);
    expect(later.deviation).toBeCloseTo(Math.sqrt(60 ** 2 + 400 * 26), 6);
  });
  it('is capped at the maximum uncertainty', () => {
    const p = player('p', 1400, 300, { lastPlayedAt: T0 });
    expect(applyInactivity(p, T0 + 520 * WEEK).deviation).toBe(350);
  });
});

describe('special results', () => {
  const s = () => states(player('a', 1300, 100), player('b', 1300, 100), player('c', 1300, 100), player('d', 1300, 100));
  it('retirement through injury does not change ratings', () => {
    const r = rateMatch(s(), doubles('x', ['a', 'b'], ['c', 'd'], 15, 10, T0, 'retired_injury'));
    expect(r.rated).toBe(false);
    expect(r.changes).toHaveLength(0);
  });
  it('unfinished games (time ran out) count at half weight', () => {
    const full = rateMatch(s(), doubles('x', ['a', 'b'], ['c', 'd'], 21, 15));
    const half = rateMatch(s(), doubles('x', ['a', 'b'], ['c', 'd'], 21, 15, T0, 'unfinished_time'));
    expect(changeOf(half.changes, 'a')).toBeCloseTo(changeOf(full.changes, 'a') / 2, 2);
  });
  it('rejects draws and duplicate players', () => {
    expect(() => rateMatch(s(), doubles('x', ['a', 'b'], ['c', 'd'], 20, 20))).toThrow();
    expect(() => rateMatch(s(), doubles('x', ['a', 'a'], ['c', 'd'], 21, 10))).toThrow();
  });
});

describe('uncertainty after matches', () => {
  it('shrinks by 0.92 per match down to the floor', () => {
    const s = states(player('a', 1300, 100), player('b', 1300, 100), player('c', 1300, 61), player('d', 1300, 61));
    const r = rateMatch(s, doubles('x', ['a', 'b'], ['c', 'd'], 21, 19));
    expect(r.updated.find((u) => u.playerId === 'a')!.deviation).toBeCloseTo(92, 6);
    expect(r.updated.find((u) => u.playerId === 'c')!.deviation).toBe(60);
  });
});

describe('adaptive confidence (§A5a, z-score check)', () => {
  function streak(n: number, cfg = DEFAULT_RATING_CONFIG) {
    const s = states(
      player('new', 1300, 300, { matchesCounted: 0, startSource: 'self' }),
      player('p', 1300, 70),
      player('o1', 1300, 70),
      player('o2', 1300, 70),
    );
    const changes = [];
    for (let i = 0; i < n; i++) {
      // Rebalance opponents so expectations stay near 50% while the newcomer keeps winning clearly.
      const newR = s.get('new')!.rating;
      s.set('o1', { ...s.get('o1')!, rating: (newR + 1300) / 2 });
      s.set('o2', { ...s.get('o2')!, rating: (newR + 1300) / 2 });
      const r = rateMatch(s, doubles(`m${i}`, ['new', 'p'], ['o1', 'o2'], 21, 12, T0 + i * 1000), cfg);
      for (const u of r.updated) s.set(u.playerId, u);
      changes.push(r.changes.find((c) => c.playerId === 'new')!);
    }
    return { s, changes };
  }

  it('never triggers before the minimum number of matches', () => {
    const { changes } = streak(7);
    expect(changes.some((c) => c.adaptiveTriggered)).toBe(false);
  });

  it('keeps confidence low and suggests a review after a sustained run above expectation', () => {
    const { s, changes } = streak(10);
    const c = changes[changes.length - 1]!;
    expect(c.adaptiveTriggered).toBe(true);
    expect(c.reviewSuggested).toBe(true);
    expect(c.deviationAfter).toBeGreaterThan(c.deviationAtStart);
    expect(confidenceOf(s.get('new')!.deviation)).toBe('low');
  });

  it('does not trigger for mixed results', () => {
    const s = states(player('a', 1300, 200), player('b', 1300, 200), player('c', 1300, 200), player('d', 1300, 200));
    let anyAdaptive = false;
    for (let i = 0; i < 20; i++) {
      const aWins = i % 2 === 0;
      const r = rateMatch(s, doubles(`m${i}`, ['a', 'b'], ['c', 'd'], aWins ? 21 : 18, aWins ? 18 : 21, T0 + i));
      anyAdaptive ||= r.changes.some((c) => c.adaptiveTriggered);
      for (const u of r.updated) s.set(u.playerId, u);
    }
    expect(anyAdaptive).toBe(false);
  });

  it('the earlier 5-match window mode remains available for comparison', () => {
    const cfg = { ...DEFAULT_RATING_CONFIG, adaptiveMode: 'window' as const, surpriseWindow: 5 };
    const { changes } = streak(5, cfg);
    expect(changes[4]!.adaptiveTriggered).toBe(true);
  });
});

describe('replay (deterministic recalculation)', () => {
  const start = () => [player('a', 1300, 300), player('b', 1250, 250), player('c', 1350, 120), player('d', 1200, 90)];
  const ev = (seq: number, pa: number, pb: number): ReplayEvent => ({
    kind: 'match',
    playSeq: seq,
    match: doubles(`m${seq}`, seq % 2 ? ['a', 'b'] : ['a', 'c'], seq % 2 ? ['c', 'd'] : ['b', 'd'], pa, pb, T0 + seq * 3600_000),
  });

  it('gives identical results regardless of input order', () => {
    const events = [ev(1, 21, 15), ev(2, 18, 21), ev(3, 21, 19), ev(4, 21, 10)];
    const r1 = replay(start(), events);
    const r2 = replay(start(), [...events].reverse());
    expect([...r2.states.values()]).toEqual([...r1.states.values()]);
  });

  it('a corrected score changes only what follows it', () => {
    const events = [ev(1, 21, 15), ev(2, 18, 21), ev(3, 21, 19)];
    const before = replay(start(), events);
    const corrected = replay(start(), [events[0]!, ev(2, 21, 18), events[2]!]);
    expect(corrected.changes.slice(0, 4)).toEqual(before.changes.slice(0, 4));
    expect(corrected.changes.slice(4, 8)).not.toEqual(before.changes.slice(4, 8));
  });

  it('applies organiser level reviews at their point in play order', () => {
    const events: ReplayEvent[] = [ev(1, 21, 15), { kind: 'level', playSeq: 2, playerId: 'a', rating: 1500, deviation: 220 }, ev(2, 21, 15)];
    const r = replay(start(), events);
    const aChange2 = r.changes.filter((c) => c.playerId === 'a')[1]!;
    expect(aChange2.ratingBefore).toBe(1500);
    expect(aChange2.deviationBefore).toBe(220);
  });
});
