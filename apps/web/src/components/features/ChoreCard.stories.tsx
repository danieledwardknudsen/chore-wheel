import type { Meta, StoryObj } from '@storybook/react';
import { ChoreCard } from './ChoreCard';
import type { ChoreJson } from '@/types/api';

const baseChore: ChoreJson = {
  id: 'chore-1',
  title: 'Wash the dishes',
  status: 'incomplete',
  dueDate: '2025-02-01',
  assigneeId: 'user-1',
  choreRuleId: null,
  createdAt: '2025-01-25T00:00:00Z',
  completedAt: null,
};

const meta: Meta<typeof ChoreCard> = {
  title: 'Features/ChoreCard',
  component: ChoreCard,
};

export default meta;
type Story = StoryObj<typeof ChoreCard>;

export const Assigned: Story = {
  render: () => <ChoreCard chore={baseChore} assigneeName="Alice" onAction={() => {}} />,
};

export const AssignedWithEmoji: Story = {
  render: () => (
    <ChoreCard chore={baseChore} assigneeName="Alice" assigneeEmoji="🎉" onAction={() => {}} />
  ),
};

export const Unassigned: Story = {
  render: () => <ChoreCard chore={{ ...baseChore, assigneeId: null }} onAction={() => {}} />,
};

export const Completed: Story = {
  render: () => (
    <ChoreCard
      chore={{ ...baseChore, status: 'complete', completedAt: '2025-02-01' }}
      assigneeName="Alice"
      onAction={() => {}}
    />
  ),
};

export const Expired: Story = {
  render: () => (
    <ChoreCard
      chore={{ ...baseChore, status: 'expired' }}
      assigneeName="Alice"
      onAction={() => {}}
    />
  ),
};
