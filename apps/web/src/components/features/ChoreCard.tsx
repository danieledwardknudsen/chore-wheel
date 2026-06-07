'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';
import type { ChoreJson } from '@/types/api';

export type ChoreCardProps = {
  chore: ChoreJson;
  currentUserId: string;
  assigneeName?: string;
  onAction: () => void;
};

export const ChoreCard = ({ chore, currentUserId, assigneeName, onAction }: ChoreCardProps) => {
  const [loading, setLoading] = useState(false);
  const {
    primitives: { Box, Button, Badge },
  } = useTheme();

  const isMine = chore.assigneeId === currentUserId;
  const isActionable = chore.status === 'incomplete';

  const doAction = async (url: string) => {
    setLoading(true);
    try {
      await fetch(url, { method: 'PATCH' });
      onAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/chores/${chore.id}`}
          className="text-sm hover:opacity-70"
          style={{ color: 'var(--color-text)', textDecoration: 'none' }}
        >
          {chore.title}
        </Link>
        <Badge status={chore.status} />
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
        due {chore.dueDate}
        {assigneeName ? ` · @${assigneeName}` : ' · unassigned'}
      </p>
      {isActionable && (
        <div className="flex gap-2 mt-3">
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
        </div>
      )}
    </Box>
  );
};
