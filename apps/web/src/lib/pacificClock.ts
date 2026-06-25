const PACIFIC_TIME_ZONE = 'America/Los_Angeles';

export const toPacificCalendarDate = (instant: Date): Date => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const part = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  const year = Number(part('year'));
  const month = Number(part('month'));
  const day = Number(part('day'));

  return new Date(Date.UTC(year, month - 1, day));
};
