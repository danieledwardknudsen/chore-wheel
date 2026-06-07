import type { Chore, ChoreStatus, CreateChoreInput } from '../types/chore';

export interface ChoreRepository {
  findExistingForRuleAndDate(ruleId: string, dueDate: Date): Promise<Chore | null>;
  findOverdueIncomplete(thresholdDate: Date): Promise<Chore[]>;
  createChore(input: CreateChoreInput): Promise<Chore>;
  updateStatus(id: string, status: ChoreStatus): Promise<void>;
  findAllIncompleteAndExpired(): Promise<Chore[]>;
}
