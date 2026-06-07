import { PostgresUserRepository } from '@chore-wheel/database';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const GET = async (): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const repo = new PostgresUserRepository(db);
  const users = await repo.findAll();
  return Response.json(users);
};
