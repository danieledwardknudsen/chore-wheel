import {
  PostgresChoreRepository,
  PostgresChoreRuleRepository,
  PostgresUserRepository,
} from '@chore-wheel/database';
import { ConsoleNotificationSink, runAssignmentJob } from '@chore-wheel/domain';
import { db } from '@/lib/db';
import { getPacificHour, toPacificCalendarDate } from '@/lib/pacificClock';

// Vercel Cron schedules are fixed in UTC and can't express a DST-aware "5 AM
// Pacific". vercel.json instead fires this route at both UTC times that can
// correspond to 5 AM Pacific (PDT and PST); whichever invocation doesn't land
// in the 5 AM Pacific hour is a no-op.
const ASSIGNMENT_HOUR_PACIFIC = 5;

export const GET = async (request: Request): Promise<Response> => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env['CRON_SECRET'];

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  if (getPacificHour(now) !== ASSIGNMENT_HOUR_PACIFIC) {
    return Response.json({ skipped: true });
  }

  const repos = {
    chores: new PostgresChoreRepository(db),
    choreRules: new PostgresChoreRuleRepository(db),
    users: new PostgresUserRepository(db),
  };

  const result = await runAssignmentJob(
    repos,
    new ConsoleNotificationSink(),
    { sendNotifications: true, websiteUrl: process.env['WEBAUTHN_ORIGIN'] ?? '' },
    toPacificCalendarDate(now),
  );

  return Response.json(result);
};
