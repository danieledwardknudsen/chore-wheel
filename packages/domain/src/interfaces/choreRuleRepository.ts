import type { ChoreAssignment, ChoreRule, ChoreRuleAssignee } from '../types/choreRule';

export interface ChoreRuleRepository {
  findAllActive(): Promise<ChoreRule[]>;
  findById(id: string): Promise<ChoreRule | null>;
  findAssigneesForRule(ruleId: string): Promise<ChoreRuleAssignee[]>;
  findRecentAssignmentsForRule(ruleId: string, lookbackCount: number): Promise<ChoreAssignment[]>;
}
