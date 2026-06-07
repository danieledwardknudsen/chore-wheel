import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ChoreSchedule } from '@chore-wheel/domain';
import { ScheduleBuilder } from './ScheduleBuilder';

const meta: Meta<typeof ScheduleBuilder> = {
  title: 'Features/ScheduleBuilder',
  component: ScheduleBuilder,
};

export default meta;
type Story = StoryObj<typeof ScheduleBuilder>;

const OneOffDemo = () => {
  const [value, setValue] = useState<ChoreSchedule>({ type: 'one_off', date: '2025-03-15' });
  return <ScheduleBuilder value={value} onChange={setValue} />;
};

const RecurringWeeklyDemo = () => {
  const [value, setValue] = useState<ChoreSchedule>({
    type: 'recurring',
    frequency: 'weekly',
    dayOfWeek: 1,
  });
  return <ScheduleBuilder value={value} onChange={setValue} />;
};

const RecurringMonthlyDemo = () => {
  const [value, setValue] = useState<ChoreSchedule>({
    type: 'recurring',
    frequency: 'monthly',
    dayOfMonth: 15,
  });
  return <ScheduleBuilder value={value} onChange={setValue} />;
};

export const OneOff: Story = {
  render: () => <OneOffDemo />,
};

export const RecurringWeekly: Story = {
  render: () => <RecurringWeeklyDemo />,
};

export const RecurringMonthly: Story = {
  render: () => <RecurringMonthlyDemo />,
};
