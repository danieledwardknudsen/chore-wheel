import { PostgresChoreRepository } from '@chore-wheel/database';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

const createSchema = z.object({
  title: z.string().min(1).max(255),
  dueDate: z.string().date(),
  assigneeId: z.string().uuid().nullable().optional(),
});

const sectionSchema = z.enum(['mine', 'unassigned', 'others']).optional();

export const GET = async (request: Request): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = sectionSchema.parse(searchParams.get('section') ?? undefined);
  const repo = new PostgresChoreRepository(db);

  if (section === 'mine') {
    return Response.json(await repo.findByAssignee(session.userId));
  }
  if (section === 'unassigned') {
    return Response.json(await repo.findUnassigned());
  }
  // Default: all incomplete + expired
  const all = await repo.findAllIncompleteAndExpired();
  if (section === 'others') {
    return Response.json(
      all.filter((c) => c.assigneeId !== null && c.assigneeId !== session.userId),
    );
  }
  return Response.json(all);
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

  const repo = new PostgresChoreRepository(db);
  const chore = await repo.createChore({
    title: parsed.data.title,
    dueDate: new Date(`${parsed.data.dueDate}T00:00:00Z`),
    assigneeId: parsed.data.assigneeId ?? null,
    choreRuleId: null,
  });
  return Response.json(chore, { status: 201 });
};
