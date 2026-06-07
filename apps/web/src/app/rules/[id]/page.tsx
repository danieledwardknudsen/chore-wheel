import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PostgresChoreRuleRepository, PostgresUserRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ChoreRuleJson, UserJson } from '@/types/api';
import { EditRuleForm } from './EditRuleForm';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditRulePage({ params }: PageProps) {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const { id } = await params;
  const ruleRepo = new PostgresChoreRuleRepository(db);
  const userRepo = new PostgresUserRepository(db);

  const [rule, users, assignees] = await Promise.all([
    ruleRepo.findById(id),
    userRepo.findAll(),
    ruleRepo.findAssigneesForRule(id),
  ]);

  if (!rule) notFound();

  const ruleJson: ChoreRuleJson = {
    id: rule.id,
    title: rule.title,
    status: rule.status as 'active' | 'inactive',
    assigneeRuleType: rule.assigneeRuleType,
    staticAssigneeId: rule.staticAssigneeId,
    scheduleType: rule.scheduleType,
    schedule: rule.schedule,
    assignees,
  };

  return <EditRuleForm rule={ruleJson} users={users as UserJson[]} />;
}
