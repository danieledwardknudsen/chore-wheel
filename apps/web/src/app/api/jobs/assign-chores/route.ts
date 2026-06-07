import {
  PostgresChoreRepository,
  PostgresChoreRuleRepository,
  PostgresUserRepository,
} from '@chore-wheel/database';
import { ConsoleNotificationSink, runAssignmentJob } from '@chore-wheel/domain';
import { db } from '@/lib/db';
import { createTwilioNotificationSink } from '@/lib/twilioNotificationSink';

export const GET = async (request: Request): Promise<Response> => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env['CRON_SECRET'];

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const repos = {
    chores: new PostgresChoreRepository(db),
    choreRules: new PostgresChoreRuleRepository(db),
    users: new PostgresUserRepository(db),
  };

  const sink = process.env['TWILIO_ACCOUNT_SID']
    ? createTwilioNotificationSink()
    : new ConsoleNotificationSink();

  const result = await runAssignmentJob(
    repos,
    sink,
    { sendNotifications: true, websiteUrl: process.env['WEBAUTHN_ORIGIN'] ?? '' },
    new Date(),
  );

  return Response.json(result);
};
