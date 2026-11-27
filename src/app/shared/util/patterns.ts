import { PrizeType } from '../models/game';

const FREE = 0;
const INDEXES = [0, 1, 2, 3, 4];

const PATTERNS: Record<PrizeType, readonly (readonly number[])[]> = {
  line: INDEXES.map((row) => INDEXES.map((column) => row * 5 + column)),
  column: INDEXES.map((column) => INDEXES.map((row) => row * 5 + column)),
  diagonal: [INDEXES.map((i) => i * 6), INDEXES.map((i) => i * 5 + (4 - i))],
  full: [Array.from({ length: 25 }, (_, index) => index)],
};

// Mirrors the API's patterns, but over the player's own marks: it only lights the BINGO button,
// the API still judges the claim by the balls drawn.
export function completedBy(
  grid: readonly number[],
  marked: ReadonlySet<number>,
  types: readonly PrizeType[],
): PrizeType[] {
  return types.filter((type) =>
    PATTERNS[type].some((cells) =>
      cells.every((index) => {
        const value = grid[index] ?? FREE;

        return value === FREE || marked.has(value);
      }),
    ),
  );
}
