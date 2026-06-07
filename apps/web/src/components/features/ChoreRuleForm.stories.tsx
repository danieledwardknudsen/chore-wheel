import type { Meta, StoryObj } from '@storybook/react';
import { ChoreRuleForm } from './ChoreRuleForm';
import type { ChoreRuleJson, UserJson } from '@/types/api';

const users: UserJson[] = [
  {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    phone: '+12065550001',
    optInTexts: true,
    optInEmails: true,
  },
  {
    id: 'user-2',
    name: 'Bob',
    email: 'bob@example.com',
    phone: '+12065550002',
    optInTexts: false,
    optInEmails: false,
  },
];

const existingRule: ChoreRuleJson = {
  id: 'rule-1',
  title: 'Weekly dishes',
  status: 'active',
  assigneeRuleType: 'round_robin',
  staticAssigneeId: null,
  scheduleType: 'recurring',
  schedule: { type: 'recurring', frequency: 'weekly', dayOfWeek: 1 },
  assignees: [
    { id: 'a-1', choreRuleId: 'rule-1', userId: 'user-1', weight: 1, position: 0 },
    { id: 'a-2', choreRuleId: 'rule-1', userId: 'user-2', weight: 1, position: 1 },
  ],
};

const meta: Meta<typeof ChoreRuleForm> = {
  title: 'Features/ChoreRuleForm',
  component: ChoreRuleForm,
};

export default meta;
type Story = StoryObj<typeof ChoreRuleForm>;

export const NewRule: Story = {
  render: () => <ChoreRuleForm users={users} onSubmit={() => {}} loading={false} />,
};

export const EditRule: Story = {
  render: () => (
    <ChoreRuleForm
      initialValues={existingRule}
      users={users}
      onSubmit={() => {}}
      onDelete={() => {}}
      loading={false}
    />
  ),
};

export const LoadingState: Story = {
  render: () => <ChoreRuleForm users={users} onSubmit={() => {}} loading={true} />,
};
