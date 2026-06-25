const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ordinalSuffix = (dayOfMonth: number): string => {
  if (dayOfMonth >= 11 && dayOfMonth <= 13) return 'th';
  switch (dayOfMonth % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

// chore.dueDate is a calendar date (YYYY-MM-DD) with no time component. Parsing it with
// `new Date(isoDate)` reads it as UTC midnight, which can roll over to the wrong local day.
// Constructing from the parsed parts keeps the calendar date fixed regardless of timezone.
export const formatDueDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]} the ${day}${ordinalSuffix(day)}`;
};
