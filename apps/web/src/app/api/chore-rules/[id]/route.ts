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

const patchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  assigneeRuleType: assigneeRuleTypeSchema.optional(),
  staticAssigneeId: z.string().uuid().nullable().optional(),
  scheduleType: z.enum(['one_off', 'recurring']).optional(),
  scheduleConfig: choreRuleScheduleConfigSchema.optional(),
  assignees: z.array(assigneeSchema).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export const GET = async (_req: Request, { params }: RouteParams): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const repo = new PostgresChoreRuleRepository(db);
  const rule = await repo.findById(id);
  if (!rule) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ ...rule, assignees: await repo.findAssigneesForRule(id) });
};

export const PATCH = async (request: Request, { params }: RouteParams): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const repo = new PostgresChoreRuleRepository(db);
  const existing = await repo.findById(id);
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const { assignees, ...ruleInput } = parsed.data;
  if (Object.keys(ruleInput).length > 0) {
    await repo.updateChoreRule(id, ruleInput);
  }
  if (assignees !== undefined) {
    await repo.setAssignees(id, assignees);
  }

  const updated = await repo.findById(id);
  return Response.json({ ...updated, assignees: await repo.findAssigneesForRule(id) });
};

export const DELETE = async (_req: Request, { params }: RouteParams): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const repo = new PostgresChoreRuleRepository(db);
  const existing = await repo.findById(id);
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await repo.deleteChoreRule(id);
  return Response.json({ ok: true });
};
