import { PostgresChoreRepository } from '@chore-wheel/database';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

type RouteParams = { params: Promise<{ id: string }> };

export const PATCH = async (_req: Request, { params }: RouteParams): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const repo = new PostgresChoreRepository(db);
  const chore = await repo.findById(id);
  if (!chore) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await repo.updateStatus(id, 'canceled');
  return Response.json({ ok: true });
};
