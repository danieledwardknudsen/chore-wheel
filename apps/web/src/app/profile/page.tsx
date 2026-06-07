import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PostgresUserRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { UserJson } from '@/types/api';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const repo = new PostgresUserRepository(db);
  const user = await repo.findById(session.userId);
  if (!user) notFound();

  return <ProfileForm user={user as UserJson} />;
}
