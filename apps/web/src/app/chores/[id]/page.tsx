import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PostgresChoreRepository, PostgresUserRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { ChoreDetail } from './ChoreDetail';

type PageProps = { params: Promise<{ id: string }> };

export default async function ChoreDetailPage({ params }: PageProps) {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const { id } = await params;
  const choreRepo = new PostgresChoreRepository(db);
  const userRepo = new PostgresUserRepository(db);

  const [chore, users] = await Promise.all([choreRepo.findById(id), userRepo.findAll()]);

  if (!chore) notFound();

  return (
    <ChoreDetail
      chore={{
        ...chore,
        dueDate: chore.dueDate.toISOString().split('T')[0] ?? chore.dueDate.toISOString(),
        createdAt: chore.createdAt.toISOString(),
      }}
      users={users}
      currentUserId={session.userId}
    />
  );
}
