import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PostgresChoreRepository, PostgresUserRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ChoreJson, UserJson } from '@/types/api';
import { ChoreDashboard } from './ChoreDashboard';

export default async function ChoresPage() {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const choreRepo = new PostgresChoreRepository(db);
  const userRepo = new PostgresUserRepository(db);

  const [chores, users] = await Promise.all([
    choreRepo.findAllIncompleteAndExpired(),
    userRepo.findAll(),
  ]);

  const choreJsons: ChoreJson[] = chores.map((c) => ({
    ...c,
    dueDate: c.dueDate.toISOString().split('T')[0] ?? c.dueDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <ChoreDashboard
      chores={choreJsons}
      users={users as UserJson[]}
      currentUserId={session.userId}
    />
  );
}
