import { PostgresChoreRuleRepository } from '@chore-wheel/database';
import { choreRuleScheduleConfigSchema } from '@chore-wheel/database';
import { assigneeRuleTypeSchema } from '@chore-wheel/database';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

const assigneeSchema = z.object({
  userId: z.string().uuid(),
  weight: z.number().positive().default(1),
  position: z.number().int().min(0),
});

const createSchema = z.object({
  title: z.string().min(1).max(255),
  assigneeRuleType: assigneeRuleTypeSchema,
  staticAssigneeId: z.string().uuid().nullable().default(null),
  scheduleType: z.enum(['one_off', 'recurring']),
  scheduleConfig: choreRuleScheduleConfigSchema,
  assignees: z.array(assigneeSchema).optional(),
});

export const GET = async (): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const repo = new PostgresChoreRuleRepository(db);
  const rules = await repo.findAllActive();

  const rulesWithAssignees = await Promise.all(
    rules.map(async (rule) => ({
      ...rule,
      assignees: await repo.findAssigneesForRule(rule.id),
    })),
  );
  return Response.json(rulesWithAssignees);
};

export const POST = async (request: Request): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { assignees, ...ruleInput } = parsed.data;
  const repo = new PostgresChoreRuleRepository(db);
  const rule = await repo.createChoreRule(ruleInput);

  if (assignees && assignees.length > 0) {
    await repo.setAssignees(rule.id, assignees);
  }

  return Response.json(
    { ...rule, assignees: await repo.findAssigneesForRule(rule.id) },
    { status: 201 },
  );
};
