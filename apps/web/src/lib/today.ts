// Returns the local calendar date as YYYY-MM-DD, matching what an <input type="date">
// expects. Date#toISOString() is UTC and can be off by a day from the user's local "today".
export const todayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
