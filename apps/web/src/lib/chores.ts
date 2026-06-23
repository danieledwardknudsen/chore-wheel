import type { Chore } from '@chore-wheel/domain';
import type { ChoreJson } from '@/types/api';

export const toChoreJson = (chore: Chore): ChoreJson => ({
  ...chore,
  dueDate: chore.dueDate.toISOString().split('T')[0] ?? chore.dueDate.toISOString(),
  createdAt: chore.createdAt.toISOString(),
  completedAt: chore.completedAt ? (chore.completedAt.toISOString().split('T')[0] ?? null) : null,
});
