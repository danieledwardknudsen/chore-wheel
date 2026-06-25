import { describe, it, expect } from 'vitest';
import { formatDueDate } from '@/lib/formatDueDate';

describe('formatDueDate', () => {
  it('formats a date as "[Day of the week] the [day of the month]"', () => {
    expect(formatDueDate('2026-06-22')).toBe('Monday the 22nd');
  });

  it('uses "st" for days ending in 1, except 11', () => {
    expect(formatDueDate('2026-06-01')).toBe('Monday the 1st');
    expect(formatDueDate('2026-06-11')).toBe('Thursday the 11th');
    expect(formatDueDate('2026-06-21')).toBe('Sunday the 21st');
  });

  it('uses "nd" for days ending in 2, except 12', () => {
    expect(formatDueDate('2026-06-02')).toBe('Tuesday the 2nd');
    expect(formatDueDate('2026-06-12')).toBe('Friday the 12th');
    expect(formatDueDate('2026-06-22')).toBe('Monday the 22nd');
  });

  it('uses "rd" for days ending in 3, except 13', () => {
    expect(formatDueDate('2026-06-03')).toBe('Wednesday the 3rd');
    expect(formatDueDate('2026-06-13')).toBe('Saturday the 13th');
    expect(formatDueDate('2026-06-23')).toBe('Tuesday the 23rd');
  });

  it('uses "th" for all other days', () => {
    expect(formatDueDate('2026-06-04')).toBe('Thursday the 4th');
    expect(formatDueDate('2026-06-30')).toBe('Tuesday the 30th');
  });
});
