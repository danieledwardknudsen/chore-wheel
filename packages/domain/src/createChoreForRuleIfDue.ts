import { calculateAssignee } from './assignmentCalculator';
import { shouldCreateChoreToday } from './scheduleEvaluator';
import type { ChoreRepository } from './interfaces/choreRepository';
import type { ChoreRuleRepository } from './interfaces/choreRuleRepository';
import type { ChoreRule } from './types/choreRule';

const RECENT_ASSIGNMENT_LOOKBACK = 100;

// Creates today's chore for a single rule when the rule is active, due today, and
// no chore for it already exists for today. Idempotent. Shared by the batch
// assignment job and the create-rule API (so a one-off rule for today produces
// its chore immediately on save).
export const createChoreForRuleIfDue = async (
  repos: { chores: ChoreRepository; choreRules: ChoreRuleRepository },
  rule: ChoreRule,
  today: Date,
): Promise<{ created: boolean }> => {
  if (rule.status !== 'active') return { created: false };
  if (!shouldCreateChoreToday(rule, today)) return { created: false };

  const existing = await repos.chores.findExistingForRuleAndDate(rule.id, today);
  if (existing) return { created: false };

  const assignees = await repos.choreRules.findAssigneesForRule(rule.id);
  const recentAssignments = await repos.choreRules.findRecentAssignmentsForRule(
    rule.id,
    RECENT_ASSIGNMENT_LOOKBACK,
  );
  const assigneeId = calculateAssignee(rule, assignees, recentAssignments);

  await repos.chores.createChore({
    title: rule.title,
    dueDate: today,
    assigneeId,
    choreRuleId: rule.id,
  });

  return { created: true };
};
