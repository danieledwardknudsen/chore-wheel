import { describe, expect, it } from 'vitest';
import { shouldCreateChoreToday } from '../scheduleEvaluator.js';
import type { ChoreRule } from '../types/choreRule.js';

const baseRule = (overrides: Partial<ChoreRule> = {}): ChoreRule => ({
  id: 'rule-1',
  title: 'Test Chore',
  status: 'active',
  assigneeRuleType: 'free_for_all',
  staticAssigneeId: null,
  scheduleType: 'one_off',
  schedule: { type: 'one_off', date: '2024-06-15' },
  ...overrides,
});

const date = (iso: string) => new Date(`${iso}T12:00:00Z`); // explicit UTC so getUTC* methods are timezone-safe

describe('shouldCreateChoreToday — one_off', () => {
  it('returns true when today matches the one-off date', () => {
    const rule = baseRule({ schedule: { type: 'one_off', date: '2024-06-15' } });
    expect(shouldCreateChoreToday(rule, date('2024-06-15'))).toBe(true);
  });

  it('returns false when today does not match the one-off date', () => {
    const rule = baseRule({ schedule: { type: 'one_off', date: '2024-06-15' } });
    expect(shouldCreateChoreToday(rule, date('2024-06-14'))).toBe(false);
    expect(shouldCreateChoreToday(rule, date('2024-06-16'))).toBe(false);
  });
});

describe('shouldCreateChoreToday — daily', () => {
  it('returns true every day', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'daily' },
    });
    expect(shouldCreateChoreToday(rule, date('2024-01-01'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-06-15'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-12-31'))).toBe(true);
  });
});

describe('shouldCreateChoreToday — weekly', () => {
  it('returns true on the specified day of week', () => {
    // 2024-06-17 is a Monday (dayOfWeek = 1)
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'weekly', dayOfWeek: 1 },
    });
    expect(shouldCreateChoreToday(rule, date('2024-06-17'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-06-24'))).toBe(true);
  });

  it('returns false on other days of the week', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'weekly', dayOfWeek: 1 },
    });
    expect(shouldCreateChoreToday(rule, date('2024-06-18'))).toBe(false); // Tuesday
    expect(shouldCreateChoreToday(rule, date('2024-06-16'))).toBe(false); // Sunday
  });

  it('returns true every day when dayOfWeek is omitted', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'weekly' },
    });
    expect(shouldCreateChoreToday(rule, date('2024-06-17'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-06-18'))).toBe(true);
  });
});

describe('shouldCreateChoreToday — biweekly', () => {
  // Reference epoch: 1970-01-05 (first Monday). Week 0 = Jan 5–11.
  // 2024-06-17 (Monday): days since epoch = 19886, weeksSinceEpoch = 2841 (odd → false for even check)
  // 2024-06-10 (Monday): days since epoch = 19879, weeksSinceEpoch = 2839 (odd → false)
  // 2024-06-03 (Monday): days since epoch = 19872, weeksSinceEpoch = 2838 (even → true)
  it('returns true on the right biweekly Monday', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'biweekly', dayOfWeek: 1 },
    });
    // Find a biweekly Monday by testing two consecutive Mondays
    const monday1 = date('2024-06-03');
    const monday2 = date('2024-06-10');
    const result1 = shouldCreateChoreToday(rule, monday1);
    const result2 = shouldCreateChoreToday(rule, monday2);
    // Exactly one of two consecutive same-weekday dates should fire for biweekly
    expect(result1).not.toBe(result2);
  });

  it('returns false on the wrong day of week regardless of week parity', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'biweekly', dayOfWeek: 1 }, // Monday
    });
    expect(shouldCreateChoreToday(rule, date('2024-06-04'))).toBe(false); // Tuesday
    expect(shouldCreateChoreToday(rule, date('2024-06-11'))).toBe(false); // Tuesday
  });
});

describe('shouldCreateChoreToday — monthly', () => {
  it('returns true on the specified day of month', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'monthly', dayOfMonth: 15 },
    });
    expect(shouldCreateChoreToday(rule, date('2024-01-15'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-06-15'))).toBe(true);
  });

  it('returns false on other days of month', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'monthly', dayOfMonth: 15 },
    });
    expect(shouldCreateChoreToday(rule, date('2024-01-14'))).toBe(false);
    expect(shouldCreateChoreToday(rule, date('2024-01-16'))).toBe(false);
  });

  it('fires on last day of month when dayOfMonth exceeds month length', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'monthly', dayOfMonth: 31 },
    });
    // February 2024 has 29 days (leap year)
    expect(shouldCreateChoreToday(rule, date('2024-02-29'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-02-28'))).toBe(false);
    // April has 30 days
    expect(shouldCreateChoreToday(rule, date('2024-04-30'))).toBe(true);
    expect(shouldCreateChoreToday(rule, date('2024-04-29'))).toBe(false);
    // January has 31 days — exact match
    expect(shouldCreateChoreToday(rule, date('2024-01-31'))).toBe(true);
  });

  it('returns false when dayOfMonth is not specified', () => {
    const rule = baseRule({
      scheduleType: 'recurring',
      schedule: { type: 'recurring', frequency: 'monthly' },
    });
    expect(shouldCreateChoreToday(rule, date('2024-01-15'))).toBe(false);
  });
});
