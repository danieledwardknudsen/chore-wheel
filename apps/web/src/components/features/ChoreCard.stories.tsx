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
};

const meta: Meta<typeof ChoreCard> = {
  title: 'Features/ChoreCard',
  component: ChoreCard,
};

export default meta;
type Story = StoryObj<typeof ChoreCard>;

export const Mine: Story = {
  render: () => (
    <ChoreCard chore={baseChore} currentUserId="user-1" assigneeName="Alice" onAction={() => {}} />
  ),
};

export const Others: Story = {
  render: () => (
    <ChoreCard chore={baseChore} currentUserId="user-2" assigneeName="Alice" onAction={() => {}} />
  ),
};

export const Unassigned: Story = {
  render: () => (
    <ChoreCard
      chore={{ ...baseChore, assigneeId: null }}
      currentUserId="user-1"
      onAction={() => {}}
    />
  ),
};

export const Completed: Story = {
  render: () => (
    <ChoreCard
      chore={{ ...baseChore, status: 'complete' }}
      currentUserId="user-1"
      assigneeName="Alice"
      onAction={() => {}}
    />
  ),
};

export const Expired: Story = {
  render: () => (
    <ChoreCard
      chore={{ ...baseChore, status: 'expired' }}
      currentUserId="user-1"
      assigneeName="Alice"
      onAction={() => {}}
    />
  ),
};
