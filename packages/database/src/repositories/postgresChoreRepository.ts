import type { ChoreRepository } from '@chore-wheel/domain';
import type { Chore, ChoreStatus, CreateChoreInput } from '@chore-wheel/domain';
import { and, desc, eq, isNull, lt, ne } from 'drizzle-orm';
import type { DatabaseClient } from '../client';
import { chores } from '../schema/index';

const toUTCDateString = (d: Date): string =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

const mapChore = (row: typeof chores.$inferSelect): Chore => ({
  id: row.id,
  title: row.title,
  status: row.status as ChoreStatus,
  dueDate: new Date(row.dueDate),
  assigneeId: row.assigneeId,
  choreRuleId: row.choreRuleId,
  createdAt: row.createdAt,
});

export class PostgresChoreRepository implements ChoreRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findExistingForRuleAndDate(ruleId: string, dueDate: Date): Promise<Chore | null> {
    const rows = await this.db
      .select()
      .from(chores)
      .where(and(eq(chores.choreRuleId, ruleId), eq(chores.dueDate, toUTCDateString(dueDate))))
      .limit(1);
    return rows[0] ? mapChore(rows[0]) : null;
  }

  async findOverdueIncomplete(thresholdDate: Date): Promise<Chore[]> {
    const rows = await this.db
      .select()
      .from(chores)
      .where(
        and(eq(chores.status, 'incomplete'), lt(chores.dueDate, toUTCDateString(thresholdDate))),
      );
    return rows.map(mapChore);
  }

  async createChore(input: CreateChoreInput): Promise<Chore> {
    const rows = await this.db
      .insert(chores)
      .values({
        title: input.title,
        dueDate: toUTCDateString(input.dueDate),
        assigneeId: input.assigneeId,
        choreRuleId: input.choreRuleId,
      })
      .returning();
    return mapChore(rows[0]!);
  }

  async updateStatus(id: string, status: ChoreStatus): Promise<void> {
    await this.db.update(chores).set({ status, updatedAt: new Date() }).where(eq(chores.id, id));
  }

  async findAllIncompleteAndExpired(): Promise<Chore[]> {
    const rows = await this.db.select().from(chores).where(ne(chores.status, 'complete'));
    return rows.filter((r) => r.status === 'incomplete' || r.status === 'expired').map(mapChore);
  }

  async findByAssignee(userId: string): Promise<Chore[]> {
    const rows = await this.db
      .select()
      .from(chores)
      .where(and(eq(chores.assigneeId, userId), eq(chores.status, 'incomplete')));
    return rows.map(mapChore);
  }

  async findUnassigned(): Promise<Chore[]> {
    const rows = await this.db
      .select()
      .from(chores)
      .where(and(isNull(chores.assigneeId), eq(chores.status, 'incomplete')));
    return rows.map(mapChore);
  }

  async reassign(id: string, newAssigneeId: string | null): Promise<void> {
    await this.db
      .update(chores)
      .set({ assigneeId: newAssigneeId, updatedAt: new Date() })
      .where(eq(chores.id, id));
  }

  async findById(id: string): Promise<Chore | null> {
    const rows = await this.db.select().from(chores).where(eq(chores.id, id)).limit(1);
    return rows[0] ? mapChore(rows[0]) : null;
  }
}
