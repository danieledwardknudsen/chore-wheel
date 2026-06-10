import { describe, expect, it } from 'vitest';
import { createChoreForRuleIfDue } from '../createChoreForRuleIfDue';
import { InMemoryChoreRepository } from '../testing/inMemoryChoreRepository';
import { InMemoryChoreRuleRepository } from '../testing/inMemoryChoreRuleRepository';
import type { ChoreRule } from '../types/choreRule';

const TODAY = new Date('2024-06-17T12:00:00Z');

const oneOffToday = (overrides: Partial<ChoreRule> = {}): ChoreRule => ({
  id: 'rule-1',
  title: 'Take out trash',
  status: 'active',
  assigneeRuleType: 'free_for_all',
  staticAssigneeId: null,
  scheduleType: 'one_off',
  schedule: { type: 'one_off', date: '2024-06-17' },
  ...overrides,
});

describe('createChoreForRuleIfDue', () => {
  it('creates a chore when the rule is due today', async () => {
    const chores = new InMemoryChoreRepository([]);
    const choreRules = new InMemoryChoreRuleRepository([]);

    const result = await createChoreForRuleIfDue({ chores, choreRules }, oneOffToday(), TODAY);

    expect(result.created).toBe(true);
    const all = await chores.findAllIncompleteAndExpired();
    expect(all).toHaveLength(1);
    expect(all[0]?.title).toBe('Take out trash');
    expect(all[0]?.choreRuleId).toBe('rule-1');
  });

  it('assigns the static assignee', async () => {
    const chores = new InMemoryChoreRepository([]);
    const choreRules = new InMemoryChoreRuleRepository([]);
    const rule = oneOffToday({ assigneeRuleType: 'static', staticAssigneeId: 'user-a' });

    await createChoreForRuleIfDue({ chores, choreRules }, rule, TODAY);

    const all = await chores.findAllIncompleteAndExpired();
    expect(all[0]?.assigneeId).toBe('user-a');
  });

  it('is idempotent — does not create a duplicate for the same day', async () => {
    const chores = new InMemoryChoreRepository([]);
    const choreRules = new InMemoryChoreRuleRepository([]);
    const rule = oneOffToday();

    await createChoreForRuleIfDue({ chores, choreRules }, rule, TODAY);
    const result2 = await createChoreForRuleIfDue({ chores, choreRules }, rule, TODAY);

    expect(result2.created).toBe(false);
    expect(await chores.findAllIncompleteAndExpired()).toHaveLength(1);
  });

  it('does not create a chore when the rule is not due today', async () => {
    const chores = new InMemoryChoreRepository([]);
    const choreRules = new InMemoryChoreRuleRepository([]);
    const rule = oneOffToday({ schedule: { type: 'one_off', date: '2024-06-18' } });

    const result = await createChoreForRuleIfDue({ chores, choreRules }, rule, TODAY);

    expect(result.created).toBe(false);
    expect(await chores.findAllIncompleteAndExpired()).toHaveLength(0);
  });

  it('does not create a chore for an inactive rule', async () => {
    const chores = new InMemoryChoreRepository([]);
    const choreRules = new InMemoryChoreRuleRepository([]);
    const rule = oneOffToday({ status: 'inactive' });

    const result = await createChoreForRuleIfDue({ chores, choreRules }, rule, TODAY);

    expect(result.created).toBe(false);
    expect(await chores.findAllIncompleteAndExpired()).toHaveLength(0);
  });
});
