import {
  PostgresChoreRepository,
  PostgresChoreRuleRepository,
  PostgresUserRepository,
} from '@chore-wheel/database';
import { ConsoleNotificationSink, runAssignmentJob } from '@chore-wheel/domain';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const POST = async (request: Request): Promise<Response> => {
  const session = await getSession(await cookies());
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const disableMessages = searchParams.get('disableMessages') === 'true';

  const repos = {
    chores: new PostgresChoreRepository(db),
    choreRules: new PostgresChoreRuleRepository(db),
    users: new PostgresUserRepository(db),
  };

  const result = await runAssignmentJob(
    repos,
    new ConsoleNotificationSink(),
    { sendNotifications: !disableMessages, websiteUrl: process.env['WEBAUTHN_ORIGIN'] ?? '' },
    new Date(),
  );

  return Response.json(result);
};
