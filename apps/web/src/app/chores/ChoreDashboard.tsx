'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { ChoreCard } from '@/components/features/ChoreCard';
import type { ChoreJson, UserJson } from '@/types/api';

type ChoreDashboardProps = {
  chores: ChoreJson[];
  recentlyCompleted: ChoreJson[];
  users: UserJson[];
  currentUserId: string;
};

type AssigneeInfo = { name: string; emoji: string | null };

type ChoreSectionProps = {
  title: string;
  emptyMessage: string;
  chores: ChoreJson[];
  userMap: Record<string, AssigneeInfo>;
  onAction: () => void;
};

const ChoreSection = ({ title, emptyMessage, chores, userMap, onAction }: ChoreSectionProps) => {
  const {
    primitives: { Box },
  } = useTheme();

  return (
    <Box title={title}>
      {chores.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {chores.map((c) => {
            const assignee = c.assigneeId != null ? userMap[c.assigneeId] : undefined;
            return (
              <ChoreCard
                key={c.id}
                chore={c}
                {...(assignee !== undefined ? { assigneeName: assignee.name } : {})}
                {...(assignee?.emoji != null ? { assigneeEmoji: assignee.emoji } : {})}
                onAction={onAction}
              />
            );
          })}
        </div>
      )}
    </Box>
  );
};

export const ChoreDashboard = ({
  chores,
  recentlyCompleted,
  users,
  currentUserId,
}: ChoreDashboardProps) => {
  const router = useRouter();

  const userMap = Object.fromEntries(users.map((u) => [u.id, { name: u.name, emoji: u.emoji }]));

  const mine = chores.filter((c) => c.assigneeId === currentUserId);
  const unassigned = chores.filter((c) => c.assigneeId === null);
  const others = chores.filter((c) => c.assigneeId !== null && c.assigneeId !== currentUserId);

  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-6 p-6">
      <ChoreSection
        title="MY CHORES"
        emptyMessage="No chores assigned to you."
        chores={mine}
        userMap={userMap}
        onAction={refresh}
      />
      <ChoreSection
        title="UNASSIGNED"
        emptyMessage="No unassigned chores."
        chores={unassigned}
        userMap={userMap}
        onAction={refresh}
      />
      <ChoreSection
        title="OTHERS"
        emptyMessage="No chores assigned to others."
        chores={others}
        userMap={userMap}
        onAction={refresh}
      />
      <ChoreSection
        title="RECENTLY COMPLETED"
        emptyMessage="No chores completed yet."
        chores={recentlyCompleted}
        userMap={userMap}
        onAction={refresh}
      />
    </div>
  );
};
