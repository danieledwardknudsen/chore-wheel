'use client';

import { useTheme } from '@/hooks/useTheme';
import type { ChoreSchedule, RecurringSchedule } from '@chore-wheel/domain';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ASCII_RADIO_STYLE: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'var(--color-text)',
};

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  padding: '0.25rem 0.5rem',
  borderRadius: 0,
  fontSize: '0.875rem',
};

export const ScheduleBuilder = ({
  value,
  onChange,
}: {
  value: ChoreSchedule;
  onChange: (s: ChoreSchedule) => void;
}) => {
  const {
    primitives: { Input, Label },
  } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-6 text-sm" style={{ color: 'var(--color-text)' }}>
        <button
          type="button"
          onClick={() => onChange({ type: 'one_off', date: '' })}
          style={ASCII_RADIO_STYLE}
        >
          {value.type === 'one_off' ? '[x]' : '[ ]'} One-off
        </button>
        <button
          type="button"
          onClick={() => onChange({ type: 'recurring', frequency: 'daily' })}
          style={ASCII_RADIO_STYLE}
        >
          {value.type === 'recurring' ? '[x]' : '[ ]'} Recurring
        </button>
      </div>

      {value.type === 'one_off' && (
        <Input
          label="Date"
          name="scheduleDate"
          type="date"
          value={value.date}
          onChange={(e) => onChange({ type: 'one_off', date: e.target.value })}
        />
      )}

      {value.type === 'recurring' && (
        <div className="flex flex-col gap-2">
          <Input
            label="Start date (optional)"
            name="scheduleStartDate"
            type="date"
            value={value.startDate ?? ''}
            onChange={(e) => {
              if (e.target.value) {
                onChange({ ...value, startDate: e.target.value });
              } else {
                const next = { ...value };
                delete next.startDate;
                onChange(next);
              }
            }}
          />
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <div className="mt-1">
              <select
                id="frequency"
                value={value.frequency}
                style={SELECT_STYLE}
                onChange={(e) =>
                  onChange({
                    type: 'recurring',
                    frequency: e.target.value as RecurringSchedule['frequency'],
                  })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {(value.frequency === 'weekly' || value.frequency === 'biweekly') && (
            <div>
              <Label htmlFor="dayOfWeek">Day of week</Label>
              <div className="mt-1">
                <select
                  id="dayOfWeek"
                  value={value.dayOfWeek ?? 0}
                  style={SELECT_STYLE}
                  onChange={(e) => onChange({ ...value, dayOfWeek: parseInt(e.target.value) })}
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {value.frequency === 'monthly' && (
            <Input
              label="Day of month (1–31)"
              name="dayOfMonth"
              type="number"
              value={String(value.dayOfMonth ?? 1)}
              onChange={(e) => onChange({ ...value, dayOfMonth: parseInt(e.target.value) || 1 })}
            />
          )}
        </div>
      )}
    </div>
  );
};
