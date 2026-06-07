import { PostgresChoreRuleRepository, PostgresUserRepository } from '@chore-wheel/database';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  optInTexts: z.boolean().optional(),
  optInEmails: z.boolean().optional(),
});

export const GET = async (): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const repo = new PostgresUserRepository(db);
  const user = await repo.findById(session.userId);
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }
  return Response.json(user);
};

export const PATCH = async (request: Request): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const repo = new PostgresUserRepository(db);
  const updated = await repo.updateProfile(session.userId, parsed.data);
  if (!updated) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }
  return Response.json(updated);
};

export const DELETE = async (): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;
  const ruleRepo = new PostgresChoreRuleRepository(db);

  // Find affected rule IDs before the FK cascade removes the assignee rows.
  const assignees = await ruleRepo.findAssigneesForRule(userId);
  const affectedRuleIds = [...new Set(assignees.map((a) => a.choreRuleId))];

  // Fetch all rules this user is an assignee of (across all rules).
  const allAffectedRuleIds: string[] = [];
  for (const rule of await ruleRepo.findAll()) {
    const ruleAssignees = await ruleRepo.findAssigneesForRule(rule.id);
    if (ruleAssignees.some((a) => a.userId === userId)) {
      allAffectedRuleIds.push(rule.id);
    }
  }

  const userRepo = new PostgresUserRepository(db);
  // FK cascade: sets chores.assigneeId = NULL, deletes choreRuleAssignees rows.
  await userRepo.deleteUser(userId);

  // Rebalance weights for rules that now have remaining assignees.
  for (const ruleId of allAffectedRuleIds) {
    await ruleRepo.rebalanceAssigneesAfterUserRemoval(ruleId);
  }

  session.destroy();
  return Response.json({ ok: true });
};
