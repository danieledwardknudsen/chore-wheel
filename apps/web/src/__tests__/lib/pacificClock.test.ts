import { describe, expect, it } from 'vitest';
import { toPacificCalendarDate } from '@/lib/pacificClock';

describe('toPacificCalendarDate', () => {
  it('returns the Pacific calendar date as a UTC-midnight Date', () => {
    // 12:00 UTC on 2024-06-17 is 05:00 Pacific on the same calendar day.
    const result = toPacificCalendarDate(new Date('2024-06-17T12:00:00Z'));
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(5); // June, 0-indexed
    expect(result.getUTCDate()).toBe(17);
    expect(result.getUTCHours()).toBe(0);
  });

  it('rolls back to the previous calendar day when UTC has already advanced', () => {
    // 02:00 UTC on 2024-06-17 is still 2024-06-16 in Pacific time (19:00 PDT the prior day).
    const result = toPacificCalendarDate(new Date('2024-06-17T02:00:00Z'));
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(5);
    expect(result.getUTCDate()).toBe(16);
  });

  it('handles the PST offset (UTC-8) correctly across a year boundary', () => {
    // 2024-01-01T07:00:00Z is 2023-12-31T23:00:00 PST — still the previous calendar day.
    const result = toPacificCalendarDate(new Date('2024-01-01T07:00:00Z'));
    expect(result.getUTCFullYear()).toBe(2023);
    expect(result.getUTCMonth()).toBe(11); // December
    expect(result.getUTCDate()).toBe(31);
  });
});
