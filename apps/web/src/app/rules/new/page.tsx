import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PostgresUserRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { UserJson } from '@/types/api';
import { NewRuleForm } from './NewRuleForm';

export default async function NewRulePage() {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const userRepo = new PostgresUserRepository(db);
  const users = await userRepo.findAll();

  return <NewRuleForm users={users as UserJson[]} />;
}
