import type { ChoreRule, RecurringSchedule } from './types/choreRule';

const toUTCDateString = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const lastDayOfMonth = (date: Date): number =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

// Fixed Monday epoch for consistent biweekly week-parity calculation.
const BIWEEKLY_EPOCH = new Date('1970-01-05');

const recurringFires = (schedule: RecurringSchedule, today: Date): boolean => {
  const todayDow = today.getUTCDay();
  const todayDom = today.getUTCDate();

  switch (schedule.frequency) {
    case 'daily':
      return true;

    case 'weekly':
      return schedule.dayOfWeek === undefined || todayDow === schedule.dayOfWeek;

    case 'biweekly': {
      if (schedule.dayOfWeek !== undefined && todayDow !== schedule.dayOfWeek) return false;
      const daysSinceEpoch = Math.floor(
        (today.getTime() - BIWEEKLY_EPOCH.getTime()) / (1000 * 60 * 60 * 24),
      );
      return Math.floor(daysSinceEpoch / 7) % 2 === 0;
    }

    case 'monthly': {
      if (schedule.dayOfMonth === undefined) return false;
      const target = Math.min(schedule.dayOfMonth, lastDayOfMonth(today));
      return todayDom === target;
    }
  }
};

export const shouldCreateChoreToday = (rule: ChoreRule, today: Date): boolean => {
  const { schedule } = rule;

  if (schedule.type === 'one_off') {
    return toUTCDateString(today) === schedule.date;
  }

  return recurringFires(schedule, today);
};
