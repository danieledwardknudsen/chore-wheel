'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { ChoreCard } from '@/components/features/ChoreCard';
import type { ChoreJson, UserJson } from '@/types/api';

type ChoreDashboardProps = {
  chores: ChoreJson[];
  users: UserJson[];
  currentUserId: string;
};

export const ChoreDashboard = ({ chores, users, currentUserId }: ChoreDashboardProps) => {
  const router = useRouter();
  const {
    primitives: { Box },
  } = useTheme();

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const mine = chores.filter((c) => c.assigneeId === currentUserId);
  const unassigned = chores.filter((c) => c.assigneeId === null);
  const others = chores.filter((c) => c.assigneeId !== null && c.assigneeId !== currentUserId);

  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Box title="MY CHORES">
        {mine.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No chores assigned to you.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {mine.map((c) => {
              const name = c.assigneeId != null ? userMap[c.assigneeId] : undefined;
              return (
                <ChoreCard
                  key={c.id}
                  chore={c}
                  currentUserId={currentUserId}
                  {...(name !== undefined ? { assigneeName: name } : {})}
                  onAction={refresh}
                />
              );
            })}
          </div>
        )}
      </Box>

      <Box title="UNASSIGNED">
        {unassigned.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No unassigned chores.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {unassigned.map((c) => (
              <ChoreCard key={c.id} chore={c} currentUserId={currentUserId} onAction={refresh} />
            ))}
          </div>
        )}
      </Box>

      <Box title="OTHERS">
        {others.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No chores assigned to others.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {others.map((c) => {
              const name = c.assigneeId != null ? userMap[c.assigneeId] : undefined;
              return (
                <ChoreCard
                  key={c.id}
                  chore={c}
                  currentUserId={currentUserId}
                  {...(name !== undefined ? { assigneeName: name } : {})}
                  onAction={refresh}
                />
              );
            })}
          </div>
        )}
      </Box>
    </div>
  );
};
