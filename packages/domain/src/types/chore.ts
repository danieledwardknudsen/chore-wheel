export type ChoreStatus = 'incomplete' | 'complete' | 'expired' | 'canceled';

export type Chore = {
  id: string;
  title: string;
  status: ChoreStatus;
  dueDate: Date;
  assigneeId: string | null;
  choreRuleId: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type CreateChoreInput = {
  title: string;
  dueDate: Date;
  assigneeId: string | null;
  choreRuleId: string | null;
};
