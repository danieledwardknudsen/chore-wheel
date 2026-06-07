import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAssignmentJob } from '../assignmentJobRunner.js';
import { InMemoryChoreRepository } from '../testing/inMemoryChoreRepository.js';
import { InMemoryChoreRuleRepository } from '../testing/inMemoryChoreRuleRepository.js';
import { InMemoryUserRepository } from '../testing/inMemoryUserRepository.js';
import { ConsoleNotificationSink } from '../testing/consoleNotificationSink.js';
import type { ChoreRule } from '../types/choreRule.js';
import type { Chore } from '../types/chore.js';
import type { User } from '../types/user.js';

const TODAY = new Date('2024-06-17T12:00:00Z'); // Monday (UTC noon)

const dailyRule = (id: string, title: string): ChoreRule => ({
  id,
  title,
  status: 'active',
  assigneeRuleType: 'free_for_all',
  staticAssigneeId: null,
  scheduleType: 'recurring',
  schedule: { type: 'recurring', frequency: 'daily' },
});

const user = (id: string, optInTexts = true): User => ({
  id,
  name: `User ${id}`,
  email: `${id}@example.com`,
  phone: '+12065550001',
  optInTexts,
  optInEmails: false,
});

const incompleteChore = (id: string, dueDate: Date, assigneeId: string | null = null): Chore => ({
  id,
  title: 'Old Chore',
  status: 'incomplete',
  dueDate,
  assigneeId,
  choreRuleId: null,
  createdAt: dueDate,
});

describe('runAssignmentJob', () => {
  it('creates a chore for each active rule that matches today', async () => {
    const choreRules = new InMemoryChoreRuleRepository([dailyRule('rule-1', 'Dishes')]);
    const chores = new InMemoryChoreRepository([]);
    const users = new InMemoryUserRepository([]);
    const sink = new ConsoleNotificationSink();

    const result = await runAssignmentJob(
      { chores, choreRules, users },
      sink,
      { sendNotifications: false, websiteUrl: 'http://localhost' },
      TODAY,
    );

    expect(result.createdCount).toBe(1);
    const allChores = await chores.findAllIncompleteAndExpired();
    expect(allChores).toHaveLength(1);
    expect(allChores[0]?.title).toBe('Dishes');
  });

  it('does not create a chore for a rule that does not match today', async () => {
    const tomorrow = new Date('2024-06-18');
    const oneOffRule: ChoreRule = {
      id: 'rule-2',
      title: 'One-off tomorrow',
      status: 'active',
      assigneeRuleType: 'free_for_all',
      staticAssigneeId: null,
      scheduleType: 'one_off',
      schedule: { type: 'one_off', date: '2024-06-18' },
    };
    const choreRules = new InMemoryChoreRuleRepository([oneOffRule]);
    const chores = new InMemoryChoreRepository([]);
    const users = new InMemoryUserRepository([]);
    const sink = new ConsoleNotificationSink();

    const result = await runAssignmentJob(
      { chores, choreRules, users },
      sink,
      { sendNotifications: false, websiteUrl: 'http://localhost' },
      TODAY,
    );

    expect(result.createdCount).toBe(0);
    void tomorrow; // suppress unused warning
  });

  it('is idempotent — running twice on the same day does not duplicate chores', async () => {
    const choreRules = new InMemoryChoreRuleRepository([dailyRule('rule-1', 'Dishes')]);
    const chores = new InMemoryChoreRepository([]);
    const users = new InMemoryUserRepository([]);
    const sink = new ConsoleNotificationSink();
    const config = { sendNotifications: false, websiteUrl: 'http://localhost' };

    await runAssignmentJob({ chores, choreRules, users }, sink, config, TODAY);
    const result2 = await runAssignmentJob({ chores, choreRules, users }, sink, config, TODAY);

    expect(result2.createdCount).toBe(0);
    expect(await chores.findAllIncompleteAndExpired()).toHaveLength(1);
  });

  it('expires incomplete chores that are more than 7 days overdue', async () => {
    const eightDaysAgo = new Date('2024-06-09'); // TODAY - 8 days
    const staleChore = incompleteChore('old-chore', eightDaysAgo);
    const choreRules = new InMemoryChoreRuleRepository([]);
    const chores = new InMemoryChoreRepository([staleChore]);
    const users = new InMemoryUserRepository([]);
    const sink = new ConsoleNotificationSink();

    const result = await runAssignmentJob(
      { chores, choreRules, users },
      sink,
      { sendNotifications: false, websiteUrl: 'http://localhost' },
      TODAY,
    );

    expect(result.expiredCount).toBe(1);
    const remaining = await chores.findAllIncompleteAndExpired();
    expect(remaining.find((c) => c.id === 'old-chore')?.status).toBe('expired');
  });

  it('does not expire a chore that is exactly 7 days overdue', async () => {
    const sevenDaysAgo = new Date('2024-06-10');
    const borderChore = incompleteChore('border-chore', sevenDaysAgo);
    const choreRules = new InMemoryChoreRuleRepository([]);
    const chores = new InMemoryChoreRepository([borderChore]);
    const users = new InMemoryUserRepository([]);
    const sink = new ConsoleNotificationSink();

    const result = await runAssignmentJob(
      { chores, choreRules, users },
      sink,
      { sendNotifications: false, websiteUrl: 'http://localhost' },
      TODAY,
    );

    expect(result.expiredCount).toBe(0);
  });

  it('sends notifications to users with text opt-in when sendNotifications=true', async () => {
    const choreRules = new InMemoryChoreRuleRepository([dailyRule('rule-1', 'Dishes')]);
    const chores = new InMemoryChoreRepository([]);
    const users = new InMemoryUserRepository([user('user-a', true), user('user-b', false)]);
    const sink = new ConsoleNotificationSink();
    const sendDailySummary = vi.spyOn(sink, 'sendDailySummary');

    const result = await runAssignmentJob(
      { chores, choreRules, users },
      sink,
      { sendNotifications: true, websiteUrl: 'http://localhost' },
      TODAY,
    );

    // Only user-a has opt-in; user-b does not
    expect(result.notificationsSent).toBe(1);
    expect(sendDailySummary).toHaveBeenCalledTimes(1);
    expect(sendDailySummary.mock.calls[0]?.[0].id).toBe('user-a');
  });

  it('skips notifications when sendNotifications=false', async () => {
    const choreRules = new InMemoryChoreRuleRepository([dailyRule('rule-1', 'Dishes')]);
    const chores = new InMemoryChoreRepository([]);
    const users = new InMemoryUserRepository([user('user-a', true)]);
    const sink = new ConsoleNotificationSink();
    const sendDailySummary = vi.spyOn(sink, 'sendDailySummary');

    const result = await runAssignmentJob(
      { chores, choreRules, users },
      sink,
      { sendNotifications: false, websiteUrl: 'http://localhost' },
      TODAY,
    );

    expect(result.notificationsSent).toBe(0);
    expect(sendDailySummary).not.toHaveBeenCalled();
  });
});
