import { describe, expect, it } from 'vitest';
import { shouldExpireChore } from '../expirationEvaluator.js';
import type { Chore } from '../types/chore.js';

const makeChore = (overrides: Partial<Chore> = {}): Chore => ({
  id: 'chore-1',
  title: 'Test Chore',
  status: 'incomplete',
  dueDate: new Date('2024-01-01'),
  assigneeId: null,
  choreRuleId: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('shouldExpireChore', () => {
  it('returns false when today is exactly the due date', () => {
    const chore = makeChore({ dueDate: new Date('2024-01-01') });
    expect(shouldExpireChore(chore, new Date('2024-01-01'))).toBe(false);
  });

  it('returns false when today is exactly 7 days after the due date', () => {
    const chore = makeChore({ dueDate: new Date('2024-01-01') });
    expect(shouldExpireChore(chore, new Date('2024-01-08'))).toBe(false);
  });

  it('returns true when today is 8 days after the due date', () => {
    const chore = makeChore({ dueDate: new Date('2024-01-01') });
    expect(shouldExpireChore(chore, new Date('2024-01-09'))).toBe(true);
  });

  it('returns false for a completed chore even if overdue by many days', () => {
    const chore = makeChore({ status: 'complete', dueDate: new Date('2024-01-01') });
    expect(shouldExpireChore(chore, new Date('2024-06-01'))).toBe(false);
  });

  it('returns false for an already-expired chore', () => {
    const chore = makeChore({ status: 'expired', dueDate: new Date('2024-01-01') });
    expect(shouldExpireChore(chore, new Date('2024-06-01'))).toBe(false);
  });
});
