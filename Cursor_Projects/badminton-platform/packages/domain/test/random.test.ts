import { describe, expect, it } from 'vitest';
import { createRng, shuffled } from '../src/index';

describe('seeded random generator', () => {
  it('is reproducible for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('differs for different seeds', () => {
    expect(createRng(1)()).not.toEqual(createRng(2)());
  });
  it('shuffles without losing items', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffled(createRng(7), items).sort((x, y) => x - y)).toEqual(items);
  });
});
