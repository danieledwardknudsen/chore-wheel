import type { ChoreRule, RecurringSchedule } from './types/choreRule';

const toUTCDateString = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const lastDayOfMonth = (date: Date): number =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

// Fixed Monday epoch used for biweekly parity when no startDate anchors it.
const BIWEEKLY_EPOCH = new Date('1970-01-05');

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

const recurringFires = (schedule: RecurringSchedule, today: Date): boolean => {
  // A startDate gates the whole schedule: nothing fires before it.
  if (schedule.startDate !== undefined && toUTCDateString(today) < schedule.startDate) {
    return false;
  }

  const todayDow = today.getUTCDay();
  const todayDom = today.getUTCDate();

  switch (schedule.frequency) {
    case 'daily':
      return true;

    case 'weekly':
      return schedule.dayOfWeek === undefined || todayDow === schedule.dayOfWeek;

    case 'biweekly': {
      if (schedule.dayOfWeek !== undefined && todayDow !== schedule.dayOfWeek) return false;
      // Anchor week parity to startDate when provided, otherwise the fixed epoch.
      const anchor = schedule.startDate
        ? new Date(`${schedule.startDate}T00:00:00Z`)
        : BIWEEKLY_EPOCH;
      const daysSinceAnchor = Math.floor((today.getTime() - anchor.getTime()) / MILLIS_PER_DAY);
      return Math.floor(daysSinceAnchor / 7) % 2 === 0;
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
