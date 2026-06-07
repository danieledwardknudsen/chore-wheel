import { PostgresChoreRepository } from '@chore-wheel/database';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

type RouteParams = { params: Promise<{ id: string }> };

const reassignSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

export const PATCH = async (request: Request, { params }: RouteParams): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = reassignSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const repo = new PostgresChoreRepository(db);
  const chore = await repo.findById(id);
  if (!chore) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await repo.reassign(id, parsed.data.assigneeId);
  return Response.json({ ok: true });
};
