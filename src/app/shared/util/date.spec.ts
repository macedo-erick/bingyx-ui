import { describe, expect, it } from 'vitest';

import { formatDayTime, fromLocalInput, toLocalInput } from './date';

describe('date helpers', () => {
  it('round-trips a moment through the datetime-local input', () => {
    const iso = '2026-12-25T00:00:00.000Z';

    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });

  it('treats an empty input as no date at all', () => {
    expect(toLocalInput(null)).toBe('');
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('not a date')).toBeNull();
  });

  it('formats a day and time the way a Brazilian invitation reads', () => {
    const formatted = formatDayTime(new Date(2026, 11, 24, 21, 0).toISOString());

    expect(formatted).toContain('24');
    expect(formatted).toContain('dez');
    expect(formatted).toContain('21:00');
  });
});
