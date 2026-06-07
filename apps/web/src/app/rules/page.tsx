import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PostgresChoreRuleRepository } from '@chore-wheel/database';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export default async function RulesPage() {
  const session = await getSession(await cookies());
  if (!session.userId) redirect('/login');

  const repo = new PostgresChoreRuleRepository(db);
  const rules = await repo.findAllActive();

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm" style={{ color: 'var(--color-text)' }}>
          CHORE RULES
        </h1>
        <Link
          href="/rules/new"
          style={{ color: 'var(--color-accent)', fontSize: '0.75rem', textDecoration: 'none' }}
        >
          + NEW RULE
        </Link>
      </div>

      {rules.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No rules yet. Create one to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                border: '1px solid var(--color-border)',
                padding: '0.75rem',
              }}
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/rules/${rule.id}`}
                  style={{
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  {rule.title}
                </Link>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {rule.assigneeRuleType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {rule.scheduleType === 'recurring'
                  ? `Recurring · ${(rule.schedule as { frequency?: string }).frequency ?? ''}`
                  : `One-off · ${(rule.schedule as { date?: string }).date ?? ''}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
