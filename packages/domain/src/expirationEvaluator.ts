import type { Chore } from './types/chore';

const toUTCDateString = (d: Date): string =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

export const shouldExpireChore = (chore: Chore, today: Date): boolean => {
  if (chore.status !== 'incomplete') return false;
  const expiryThreshold = new Date(chore.dueDate);
  // Use UTC date arithmetic â€” dueDate is a calendar day, not a moment in time.
  expiryThreshold.setUTCDate(expiryThreshold.getUTCDate() + 7);
  return toUTCDateString(today) > toUTCDateString(expiryThreshold);
};
