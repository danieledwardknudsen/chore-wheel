import type {
  ChoreAssignment,
  ChoreRule,
  ChoreRuleAssignee,
  ChoreRuleRepository,
} from '@chore-wheel/domain';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DatabaseClient } from '../client.js';
import { choreRuleAssignees, choreRules, chores } from '../schema/index.js';
import { choreRuleScheduleConfigSchema } from '../validation/choreRuleScheduleConfig.js';
import type { AssigneeRuleType, ChoreSchedule } from '@chore-wheel/domain';

const mapChoreRule = (row: typeof choreRules.$inferSelect): ChoreRule => ({
  id: row.id,
  title: row.title,
  status: row.status as 'active' | 'inactive',
  assigneeRuleType: row.assigneeRuleType as AssigneeRuleType,
  staticAssigneeId: row.staticAssigneeId,
  scheduleType: row.scheduleType as 'one_off' | 'recurring',
  schedule: choreRuleScheduleConfigSchema.parse(row.scheduleConfig) as ChoreSchedule,
});

const mapAssignee = (row: typeof choreRuleAssignees.$inferSelect): ChoreRuleAssignee => ({
  id: row.id,
  choreRuleId: row.choreRuleId,
  userId: row.userId,
  weight: parseFloat(row.weight),
  position: row.position,
});

export type CreateChoreRuleInput = {
  title: string;
  assigneeRuleType: string;
  staticAssigneeId?: string | null;
  scheduleType: string;
  scheduleConfig: unknown;
};

export type UpdateChoreRuleInput = {
  title?: string | undefined;
  assigneeRuleType?: string | undefined;
  staticAssigneeId?: string | null | undefined;
  scheduleType?: string | undefined;
  scheduleConfig?: unknown;
  status?: string | undefined;
};

export class PostgresChoreRuleRepository implements ChoreRuleRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findAllActive(): Promise<ChoreRule[]> {
    const rows = await this.db.select().from(choreRules).where(eq(choreRules.status, 'active'));
    return rows.map(mapChoreRule);
  }

  async findAll(): Promise<ChoreRule[]> {
    const rows = await this.db.select().from(choreRules);
    return rows.map(mapChoreRule);
  }

  async findById(id: string): Promise<ChoreRule | null> {
    const rows = await this.db.select().from(choreRules).where(eq(choreRules.id, id)).limit(1);
    return rows[0] ? mapChoreRule(rows[0]) : null;
  }

  async findAssigneesForRule(ruleId: string): Promise<ChoreRuleAssignee[]> {
    const rows = await this.db
      .select()
      .from(choreRuleAssignees)
      .where(eq(choreRuleAssignees.choreRuleId, ruleId));
    return rows.map(mapAssignee);
  }

  async findRecentAssignmentsForRule(
    ruleId: string,
    lookbackCount: number,
  ): Promise<ChoreAssignment[]> {
    const rows = await this.db
      .select({ id: chores.id, choreRuleId: chores.choreRuleId, assigneeId: chores.assigneeId })
      .from(chores)
      .where(and(eq(chores.choreRuleId, ruleId), isNotNull(chores.assigneeId)))
      .orderBy(desc(chores.dueDate))
      .limit(lookbackCount);
    return rows.map((r) => ({
      choreId: r.id,
      ruleId: r.choreRuleId!,
      assigneeId: r.assigneeId!,
    }));
  }

  async createChoreRule(input: CreateChoreRuleInput): Promise<ChoreRule> {
    const rows = await this.db
      .insert(choreRules)
      .values({
        title: input.title,
        assigneeRuleType: input.assigneeRuleType,
        staticAssigneeId: input.staticAssigneeId ?? null,
        scheduleType: input.scheduleType,
        scheduleConfig: input.scheduleConfig,
      })
      .returning();
    return mapChoreRule(rows[0]!);
  }

  async updateChoreRule(id: string, input: UpdateChoreRuleInput): Promise<ChoreRule | null> {
    const rows = await this.db
      .update(choreRules)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(choreRules.id, id))
      .returning();
    return rows[0] ? mapChoreRule(rows[0]) : null;
  }

  async deleteChoreRule(id: string): Promise<void> {
    await this.db.update(choreRules).set({ status: 'inactive' }).where(eq(choreRules.id, id));
  }

  async setAssignees(
    ruleId: string,
    assignees: Array<{ userId: string; weight: number; position: number }>,
  ): Promise<void> {
    await this.db.delete(choreRuleAssignees).where(eq(choreRuleAssignees.choreRuleId, ruleId));
    if (assignees.length > 0) {
      await this.db.insert(choreRuleAssignees).values(
        assignees.map((a) => ({
          choreRuleId: ruleId,
          userId: a.userId,
          weight: a.weight.toFixed(4),
          position: a.position,
        })),
      );
    }
  }

  async rebalanceAssigneesAfterUserRemoval(ruleId: string): Promise<void> {
    const remaining = await this.db
      .select()
      .from(choreRuleAssignees)
      .where(eq(choreRuleAssignees.choreRuleId, ruleId));

    if (remaining.length === 0) return;

    const equalWeight = (1 / remaining.length).toFixed(4);
    for (let i = 0; i < remaining.length; i++) {
      await this.db
        .update(choreRuleAssignees)
        .set({ weight: equalWeight, position: i })
        .where(eq(choreRuleAssignees.id, remaining[i]!.id));
    }
  }
}
