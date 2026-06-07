import { describe, expect, it } from 'vitest';
import { calculateAssignee } from '../assignmentCalculator';
import type { ChoreAssignment, ChoreRule, ChoreRuleAssignee } from '../types/choreRule';

const baseRule = (overrides: Partial<ChoreRule> = {}): ChoreRule => ({
  id: 'rule-1',
  title: 'Test',
  status: 'active',
  assigneeRuleType: 'round_robin',
  staticAssigneeId: null,
  scheduleType: 'recurring',
  schedule: { type: 'recurring', frequency: 'daily' },
  ...overrides,
});

const assignee = (userId: string, position: number, weight = 1): ChoreRuleAssignee => ({
  id: `assignee-${userId}`,
  choreRuleId: 'rule-1',
  userId,
  weight,
  position,
});

const assignment = (assigneeId: string): ChoreAssignment => ({
  choreId: `chore-${assigneeId}`,
  ruleId: 'rule-1',
  assigneeId,
});

describe('calculateAssignee â€” static', () => {
  it('returns the static assignee id', () => {
    const rule = baseRule({ assigneeRuleType: 'static', staticAssigneeId: 'user-a' });
    expect(calculateAssignee(rule, [], [])).toBe('user-a');
  });

  it('returns null when staticAssigneeId is null', () => {
    const rule = baseRule({ assigneeRuleType: 'static', staticAssigneeId: null });
    expect(calculateAssignee(rule, [], [])).toBe(null);
  });
});

describe('calculateAssignee â€” free_for_all', () => {
  it('always returns null', () => {
    const rule = baseRule({ assigneeRuleType: 'free_for_all' });
    expect(calculateAssignee(rule, [assignee('user-a', 0)], [])).toBe(null);
  });
});

describe('calculateAssignee â€” round_robin', () => {
  it('returns the first assignee by position when no prior assignments exist', () => {
    const rule = baseRule();
    const assignees = [assignee('user-b', 1), assignee('user-a', 0)];
    expect(calculateAssignee(rule, assignees, [])).toBe('user-a'); // position 0 wins
  });

  it('returns the assignee with the largest deficit after one assignment', () => {
    const rule = baseRule();
    const assignees = [assignee('user-a', 0), assignee('user-b', 1)];
    // user-a was assigned once; user-b has deficit of 0.5 - 0 = 0.5 â†’ user-b
    expect(calculateAssignee(rule, assignees, [assignment('user-a')])).toBe('user-b');
  });

  it('cycles correctly with equal weights over multiple rounds', () => {
    const rule = baseRule();
    const assignees = [assignee('user-a', 0), assignee('user-b', 1)];

    // Round 1: no history â†’ user-a
    const r1 = calculateAssignee(rule, assignees, []);
    expect(r1).toBe('user-a');

    // Round 2: user-a was assigned â†’ user-b
    const r2 = calculateAssignee(rule, assignees, [assignment('user-a')]);
    expect(r2).toBe('user-b');

    // Round 3: both assigned once â†’ tied â†’ user-a (first by position)
    const r3 = calculateAssignee(rule, assignees, [assignment('user-a'), assignment('user-b')]);
    expect(r3).toBe('user-a');
  });

  it('respects unequal weights', () => {
    const rule = baseRule();
    // user-a weight=3, user-b weight=1 â†’ targets: 0.75 / 0.25
    const assignees = [assignee('user-a', 0, 3), assignee('user-b', 1, 1)];

    // After 1 assignment to user-a: deficit user-a=0.75-1=-0.25, user-b=0.25-0=0.25 â†’ user-b
    expect(calculateAssignee(rule, assignees, [assignment('user-a')])).toBe('user-b');

    // After 1 to user-a, 1 to user-b: deficit user-a=0.75-0.5=0.25, user-b=0.25-0.5=-0.25 â†’ user-a
    expect(calculateAssignee(rule, assignees, [assignment('user-a'), assignment('user-b')])).toBe(
      'user-a',
    );
  });

  it('ignores assignments to users no longer in the assignee list', () => {
    const rule = baseRule();
    const assignees = [assignee('user-a', 0), assignee('user-b', 1)];
    // user-deleted was in history but is no longer an assignee
    const history = [assignment('user-deleted'), assignment('user-deleted')];
    // No relevant assignments â†’ user-a by position
    expect(calculateAssignee(rule, assignees, history)).toBe('user-a');
  });

  it('returns null when the assignee list is empty', () => {
    const rule = baseRule();
    expect(calculateAssignee(rule, [], [])).toBe(null);
  });
});
