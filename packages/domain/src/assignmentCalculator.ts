import type { ChoreAssignment, ChoreRule, ChoreRuleAssignee } from './types/choreRule';

const calculateRoundRobin = (
  assignees: ChoreRuleAssignee[],
  recentAssignments: ChoreAssignment[],
): string | null => {
  if (assignees.length === 0) return null;

  const totalWeight = assignees.reduce((sum, a) => sum + a.weight, 0);
  const assigneeIds = new Set(assignees.map((a) => a.userId));

  const counts = new Map<string, number>();
  assignees.forEach((a) => counts.set(a.userId, 0));

  const relevant = recentAssignments.filter((a) => assigneeIds.has(a.assigneeId));
  relevant.forEach((a) => counts.set(a.assigneeId, (counts.get(a.assigneeId) ?? 0) + 1));

  const total = relevant.length;

  const sorted = [...assignees].sort((a, b) => a.position - b.position);

  let best = sorted[0]!;
  let bestDeficit = -Infinity;

  for (const assignee of sorted) {
    const target = assignee.weight / totalWeight;
    const observed = total === 0 ? 0 : (counts.get(assignee.userId) ?? 0) / total;
    const deficit = target - observed;
    if (deficit > bestDeficit) {
      bestDeficit = deficit;
      best = assignee;
    }
  }

  return best.userId;
};

export const calculateAssignee = (
  rule: ChoreRule,
  assignees: ChoreRuleAssignee[],
  recentAssignments: ChoreAssignment[],
): string | null => {
  switch (rule.assigneeRuleType) {
    case 'static':
      return rule.staticAssigneeId;
    case 'free_for_all':
      return null;
    case 'round_robin':
      return calculateRoundRobin(assignees, recentAssignments);
  }
};
