import { describe, expect, it } from 'vitest';

import { completedBy } from './patterns';

// prettier-ignore
const GRID = [
  1, 16, 31, 46, 61,
  2, 17, 32, 47, 62,
  3, 18, 0, 48, 63,
  4, 19, 34, 49, 64,
  5, 20, 35, 50, 65,
];

const ALL = ['line', 'column', 'diagonal', 'full'] as const;

describe('patterns closed by the player’s marks', () => {
  it('sees a line, counting the free centre', () => {
    expect(completedBy(GRID, new Set([3, 18, 48, 63]), ALL)).toEqual(['line']);
  });

  it('sees a column and a diagonal', () => {
    expect(completedBy(GRID, new Set([1, 2, 3, 4, 5]), ALL)).toEqual(['column']);
    expect(completedBy(GRID, new Set([1, 17, 49, 65]), ALL)).toEqual(['diagonal']);
  });

  it('only looks at the prizes it is asked about', () => {
    expect(completedBy(GRID, new Set([1, 2, 3, 4, 5]), ['line'])).toEqual([]);
  });

  it('sees nothing in scattered marks', () => {
    expect(completedBy(GRID, new Set([1, 17, 48, 64]), ALL)).toEqual([]);
  });
});
