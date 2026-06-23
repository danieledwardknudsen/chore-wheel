import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PostgresChoreRepository, PostgresUserRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { toChoreJson } from '@/lib/chores';
import type { UserJson } from '@/types/api';
import { ChoreDashboard } from './ChoreDashboard';

const RECENTLY_COMPLETED_LIMIT = 10;

export default async function ChoresPage() {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const choreRepo = new PostgresChoreRepository(db);
  const userRepo = new PostgresUserRepository(db);

  const [chores, recentlyCompleted, users] = await Promise.all([
    choreRepo.findAllIncompleteAndExpired(),
    choreRepo.findRecentlyCompleted(RECENTLY_COMPLETED_LIMIT),
    userRepo.findAll(),
  ]);

  return (
    <ChoreDashboard
      chores={chores.map(toChoreJson)}
      recentlyCompleted={recentlyCompleted.map(toChoreJson)}
      users={users as UserJson[]}
      currentUserId={session.userId}
    />
  );
}
