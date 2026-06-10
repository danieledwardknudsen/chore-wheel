export type OneOffSchedule = {
  type: 'one_off';
  date: string; // ISO date string YYYY-MM-DD
};

export type RecurringSchedule = {
  type: 'recurring';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0–6, used by weekly/biweekly
  dayOfMonth?: number; // 1–31, used by monthly
  startDate?: string; // ISO date YYYY-MM-DD; chore does not fire before this date, and anchors biweekly parity
};

export type ChoreSchedule = OneOffSchedule | RecurringSchedule;

export type AssigneeRuleType = 'static' | 'round_robin' | 'free_for_all';

export type ChoreRule = {
  id: string;
  title: string;
  status: 'active' | 'inactive';
  assigneeRuleType: AssigneeRuleType;
  staticAssigneeId: string | null;
  scheduleType: 'one_off' | 'recurring';
  schedule: ChoreSchedule;
};

export type ChoreRuleAssignee = {
  id: string;
  choreRuleId: string;
  userId: string;
  weight: number;
  position: number;
};

export type ChoreAssignment = {
  choreId: string;
  ruleId: string;
  assigneeId: string;
};
