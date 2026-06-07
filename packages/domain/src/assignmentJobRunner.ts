import { calculateAssignee } from './assignmentCalculator';
import { shouldExpireChore } from './expirationEvaluator';
import { shouldCreateChoreToday } from './scheduleEvaluator';
import type { ChoreRepository } from './interfaces/choreRepository';
import type { ChoreRuleRepository } from './interfaces/choreRuleRepository';
import type { NotificationSink } from './interfaces/notificationSink';
import type { UserRepository } from './interfaces/userRepository';

export type AssignmentJobConfig = {
  sendNotifications: boolean;
  websiteUrl: string;
};

export type AssignmentJobResult = {
  expiredCount: number;
  createdCount: number;
  notificationsSent: number;
};

export const runAssignmentJob = async (
  repos: { chores: ChoreRepository; choreRules: ChoreRuleRepository; users: UserRepository },
  sink: NotificationSink,
  config: AssignmentJobConfig,
  today: Date,
): Promise<AssignmentJobResult> => {
  let expiredCount = 0;
  let createdCount = 0;
  let notificationsSent = 0;

  // Step 1: Expire overdue incomplete chores.
  const candidates = await repos.chores.findAllIncompleteAndExpired();
  const expiredIds = new Set<string>();
  for (const chore of candidates) {
    if (shouldExpireChore(chore, today)) {
      await repos.chores.updateStatus(chore.id, 'expired');
      expiredIds.add(chore.id);
      expiredCount++;
    }
  }

  // Step 2: Create chores for active rules that fire today.
  const activeRules = await repos.choreRules.findAllActive();
  for (const rule of activeRules) {
    if (!shouldCreateChoreToday(rule, today)) continue;

    const existing = await repos.chores.findExistingForRuleAndDate(rule.id, today);
    if (existing) continue;

    const assignees = await repos.choreRules.findAssigneesForRule(rule.id);
    const recentAssignments = await repos.choreRules.findRecentAssignmentsForRule(rule.id, 100);
    const assigneeId = calculateAssignee(rule, assignees, recentAssignments);

    await repos.chores.createChore({
      title: rule.title,
      dueDate: today,
      assigneeId,
      choreRuleId: rule.id,
    });
    createdCount++;
  }

  // Step 3: Send daily summaries to opted-in users.
  if (config.sendNotifications) {
    const allChores = await repos.chores.findAllIncompleteAndExpired();
    const incompleteChores = allChores.filter(
      (c) => c.status === 'incomplete' && !expiredIds.has(c.id),
    );
    const unassignedChores = incompleteChores.filter((c) => c.assigneeId === null);

    const usersToNotify = await repos.users.findUsersWithTextOptIn();
    for (const user of usersToNotify) {
      const assignedChores = incompleteChores.filter((c) => c.assigneeId === user.id);
      await sink.sendDailySummary(user, assignedChores, unassignedChores, config.websiteUrl);
      notificationsSent++;
    }
  }

  return { expiredCount, createdCount, notificationsSent };
};
