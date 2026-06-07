import type { ChoreRuleRepository } from '../interfaces/choreRuleRepository.js';
import type { ChoreAssignment, ChoreRule, ChoreRuleAssignee } from '../types/choreRule.js';

export class InMemoryChoreRuleRepository implements ChoreRuleRepository {
  private readonly rules: ChoreRule[];
  private readonly assignees: ChoreRuleAssignee[];
  private readonly assignments: ChoreAssignment[];

  constructor(
    rules: ChoreRule[] = [],
    assignees: ChoreRuleAssignee[] = [],
    assignments: ChoreAssignment[] = [],
  ) {
    this.rules = [...rules];
    this.assignees = [...assignees];
    this.assignments = [...assignments];
  }

  findAllActive(): Promise<ChoreRule[]> {
    return Promise.resolve(this.rules.filter((r) => r.status === 'active'));
  }

  findById(id: string): Promise<ChoreRule | null> {
    return Promise.resolve(this.rules.find((r) => r.id === id) ?? null);
  }

  findAssigneesForRule(ruleId: string): Promise<ChoreRuleAssignee[]> {
    return Promise.resolve(this.assignees.filter((a) => a.choreRuleId === ruleId));
  }

  findRecentAssignmentsForRule(ruleId: string, lookbackCount: number): Promise<ChoreAssignment[]> {
    const matching = this.assignments.filter((a) => a.ruleId === ruleId);
    return Promise.resolve(matching.slice(-lookbackCount));
  }
}
