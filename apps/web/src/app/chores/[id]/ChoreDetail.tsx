'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';
import type { ChoreJson, UserJson } from '@/types/api';

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  padding: '0.25rem 0.5rem',
  borderRadius: 0,
  fontSize: '0.875rem',
};

type ChoreDetailProps = {
  chore: ChoreJson;
  users: UserJson[];
  currentUserId: string;
};

export const ChoreDetail = ({ chore, users, currentUserId }: ChoreDetailProps) => {
  const router = useRouter();
  const {
    primitives: { Box, Button, Badge },
  } = useTheme();

  const [loading, setLoading] = useState(false);
  const [reassignId, setReassignId] = useState<string>(chore.assigneeId ?? '');

  const assigneeName = users.find((u) => u.id === chore.assigneeId)?.name;
  const isActionable = chore.status === 'incomplete';
  const isMine = chore.assigneeId === currentUserId;

  const doAction = async (url: string, method = 'PATCH', body?: object) => {
    setLoading(true);
    try {
      const init: RequestInit = { method };
      if (body) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(body);
      }
      await fetch(url, init);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link href="/chores" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        ← back to chores
      </Link>

      <Box title="CHORE DETAIL">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h1 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {chore.title}
          </h1>
          <Badge status={chore.status} />
        </div>
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Due: {chore.dueDate}
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Assignee: {assigneeName ? `@${assigneeName}` : 'unassigned'}
        </p>

        {isActionable && (
          <div className="flex flex-col gap-4">
            {isMine && (
              <Button
                variant="primary"
                size="sm"
                loading={loading}
                onClick={() => void doAction(`/api/chores/${chore.id}/complete`)}
              >
                Complete
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              loading={loading}
              onClick={() => void doAction(`/api/chores/${chore.id}/cancel`)}
            >
              Cancel
            </Button>

            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Reassign to:
              </p>
              <div className="flex gap-2">
                <select
                  value={reassignId}
                  style={SELECT_STYLE}
                  onChange={(e) => setReassignId(e.target.value)}
                >
                  <option value="">-- unassign --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={loading}
                  onClick={() =>
                    void doAction(`/api/chores/${chore.id}/reassign`, 'PATCH', {
                      assigneeId: reassignId || null,
                    })
                  }
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </Box>
    </div>
  );
};
