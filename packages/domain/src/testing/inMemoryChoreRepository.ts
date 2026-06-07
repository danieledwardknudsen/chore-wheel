import type { ChoreRepository } from '../interfaces/choreRepository';
import type { Chore, ChoreStatus, CreateChoreInput } from '../types/chore';

let nextId = 1;
const generateId = () => `chore-mem-${nextId++}`;

export class InMemoryChoreRepository implements ChoreRepository {
  private readonly chores: Chore[];

  constructor(chores: Chore[] = []) {
    this.chores = [...chores];
  }

  findExistingForRuleAndDate(ruleId: string, dueDate: Date): Promise<Chore | null> {
    const match = this.chores.find(
      (c) => c.choreRuleId === ruleId && c.dueDate.toDateString() === dueDate.toDateString(),
    );
    return Promise.resolve(match ?? null);
  }

  findOverdueIncomplete(thresholdDate: Date): Promise<Chore[]> {
    return Promise.resolve(
      this.chores.filter((c) => c.status === 'incomplete' && c.dueDate < thresholdDate),
    );
  }

  createChore(input: CreateChoreInput): Promise<Chore> {
    const chore: Chore = {
      id: generateId(),
      title: input.title,
      status: 'incomplete',
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      choreRuleId: input.choreRuleId,
      createdAt: new Date(),
    };
    this.chores.push(chore);
    return Promise.resolve(chore);
  }

  updateStatus(id: string, status: ChoreStatus): Promise<void> {
    const chore = this.chores.find((c) => c.id === id);
    if (chore) {
      chore.status = status;
    }
    return Promise.resolve();
  }

  findAllIncompleteAndExpired(): Promise<Chore[]> {
    return Promise.resolve(
      this.chores.filter((c) => c.status === 'incomplete' || c.status === 'expired'),
    );
  }
}
