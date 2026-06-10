import type { AssigneeRuleType, ChoreSchedule, ChoreStatus } from '@chore-wheel/domain';

export type ChoreJson = {
  id: string;
  title: string;
  status: ChoreStatus;
  dueDate: string;
  assigneeId: string | null;
  choreRuleId: string | null;
  createdAt: string;
};

export type ChoreRuleAssigneeJson = {
  id: string;
  choreRuleId: string;
  userId: string;
  weight: number;
  position: number;
};

export type ChoreRuleJson = {
  id: string;
  title: string;
  status: 'active' | 'inactive';
  assigneeRuleType: AssigneeRuleType;
  staticAssigneeId: string | null;
  scheduleType: 'one_off' | 'recurring';
  schedule: ChoreSchedule;
  assignees: ChoreRuleAssigneeJson[];
};

export type UserJson = {
  id: string;
  name: string;
  email: string;
  optInEmails: boolean;
};

export type RuleFormData = {
  title: string;
  assigneeRuleType: AssigneeRuleType;
  staticAssigneeId: string | null;
  scheduleType: 'one_off' | 'recurring';
  scheduleConfig: ChoreSchedule;
  assignees: Array<{ userId: string; weight: number; position: number }>;
};
