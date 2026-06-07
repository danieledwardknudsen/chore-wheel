import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { RunJobButton } from './RunJobButton';

export default async function RunJobPage() {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-sm" style={{ color: 'var(--color-text)' }}>
        ADMIN: RUN ASSIGNMENT JOB
      </h1>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Manually trigger the chore assignment job without sending notifications.
      </p>
      <RunJobButton />
    </div>
  );
}
