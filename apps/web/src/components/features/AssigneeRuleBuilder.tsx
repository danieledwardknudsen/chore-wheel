'use client';

import type { AssigneeRuleType } from '@chore-wheel/domain';
import type { UserJson } from '@/types/api';

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  padding: '0.25rem 0.5rem',
  borderRadius: 0,
  fontSize: '0.875rem',
};

const ASCII_RADIO_STYLE: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'var(--color-text)',
};

type AssigneeRuleBuilderProps = {
  ruleType: AssigneeRuleType;
  staticAssigneeId: string | null;
  selectedUserIds: string[];
  users: UserJson[];
  onChange: (opts: {
    ruleType: AssigneeRuleType;
    staticAssigneeId: string | null;
    userIds: string[];
  }) => void;
};

export const AssigneeRuleBuilder = ({
  ruleType,
  staticAssigneeId,
  selectedUserIds,
  users,
  onChange,
}: AssigneeRuleBuilderProps) => {
  const toggleUser = (userId: string) => {
    const next = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];
    onChange({ ruleType, staticAssigneeId, userIds: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 text-sm flex-wrap" style={{ color: 'var(--color-text)' }}>
        {(['free_for_all', 'round_robin', 'static'] as AssigneeRuleType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ ruleType: type, staticAssigneeId: null, userIds: [] })}
            style={ASCII_RADIO_STYLE}
          >
            {ruleType === type ? '[x]' : '[ ]'} {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {ruleType === 'static' && (
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Always assigned to:
          </p>
          <select
            value={staticAssigneeId ?? ''}
            style={SELECT_STYLE}
            onChange={(e) =>
              onChange({ ruleType, staticAssigneeId: e.target.value || null, userIds: [] })
            }
          >
            <option value="">-- select user --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {ruleType === 'round_robin' && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Rotate among (click to toggle):
          </p>
          <div className="flex gap-2 flex-wrap">
            {users.map((u) => {
              const selected = selectedUserIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  style={{
                    background: selected ? 'var(--color-accent)' : 'transparent',
                    color: selected ? 'var(--color-bg)' : 'var(--color-text)',
                    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    fontFamily: 'inherit',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.5rem',
                    cursor: 'pointer',
                    borderRadius: 0,
                  }}
                >
                  @{u.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
