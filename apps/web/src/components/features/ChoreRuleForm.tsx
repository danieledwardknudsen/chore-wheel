'use client';

import { useState } from 'react';
import type { AssigneeRuleType, ChoreSchedule } from '@chore-wheel/domain';
import { useTheme } from '@/hooks/useTheme';
import { ScheduleBuilder } from './ScheduleBuilder';
import { AssigneeRuleBuilder } from './AssigneeRuleBuilder';
import type { ChoreRuleJson, RuleFormData, UserJson } from '@/types/api';

type ChoreRuleFormProps = {
  initialValues?: ChoreRuleJson;
  users: UserJson[];
  onSubmit: (data: RuleFormData) => void;
  onDelete?: () => void;
  loading: boolean;
};

export const ChoreRuleForm = ({
  initialValues,
  users,
  onSubmit,
  onDelete,
  loading,
}: ChoreRuleFormProps) => {
  const {
    primitives: { Box, Button, Input },
  } = useTheme();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [titleError, setTitleError] = useState('');
  const [schedule, setSchedule] = useState<ChoreSchedule>(
    initialValues?.schedule ?? { type: 'one_off', date: '' },
  );
  const [ruleType, setRuleType] = useState<AssigneeRuleType>(
    initialValues?.assigneeRuleType ?? 'free_for_all',
  );
  const [staticAssigneeId, setStaticAssigneeId] = useState<string | null>(
    initialValues?.staticAssigneeId ?? null,
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialValues?.assignees.map((a) => a.userId) ?? [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    const assignees =
      ruleType === 'round_robin'
        ? selectedUserIds.map((userId, i) => ({ userId, weight: 1, position: i }))
        : ruleType === 'static' && staticAssigneeId
          ? [{ userId: staticAssigneeId, weight: 1, position: 0 }]
          : [];

    onSubmit({
      title: title.trim(),
      assigneeRuleType: ruleType,
      staticAssigneeId,
      scheduleType: schedule.type,
      scheduleConfig: schedule,
      assignees,
    });
  };

  return (
    <Box title={initialValues ? 'EDIT RULE' : 'NEW RULE'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError('');
          }}
          error={titleError}
        />

        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Schedule
          </p>
          <ScheduleBuilder value={schedule} onChange={setSchedule} />
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Assignee rule
          </p>
          <AssigneeRuleBuilder
            ruleType={ruleType}
            staticAssigneeId={staticAssigneeId}
            selectedUserIds={selectedUserIds}
            users={users}
            onChange={({ ruleType: rt, staticAssigneeId: sid, userIds }) => {
              setRuleType(rt);
              setStaticAssigneeId(sid);
              setSelectedUserIds(userIds);
            }}
          />
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="submit" variant="primary" size="md" loading={loading}>
            Save
          </Button>
          {onDelete && (
            <Button type="button" variant="danger" size="md" onClick={onDelete} loading={loading}>
              Delete
            </Button>
          )}
        </div>
      </form>
    </Box>
  );
};
