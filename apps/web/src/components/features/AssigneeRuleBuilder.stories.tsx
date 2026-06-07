import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { AssigneeRuleType } from '@chore-wheel/domain';
import { AssigneeRuleBuilder } from './AssigneeRuleBuilder';
import type { UserJson } from '@/types/api';

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
  {
    id: 'user-3',
    name: 'Carol',
    email: 'carol@example.com',
    phone: '+12065550003',
    optInTexts: true,
    optInEmails: false,
  },
];

const meta: Meta<typeof AssigneeRuleBuilder> = {
  title: 'Features/AssigneeRuleBuilder',
  component: AssigneeRuleBuilder,
};

export default meta;
type Story = StoryObj<typeof AssigneeRuleBuilder>;

type State = {
  ruleType: AssigneeRuleType;
  staticAssigneeId: string | null;
  selectedUserIds: string[];
};

const InteractiveDemo = ({ initial }: { initial: State }) => {
  const [state, setState] = useState<State>(initial);
  return (
    <AssigneeRuleBuilder
      ruleType={state.ruleType}
      staticAssigneeId={state.staticAssigneeId}
      selectedUserIds={state.selectedUserIds}
      users={users}
      onChange={({ ruleType, staticAssigneeId, userIds }) =>
        setState({ ruleType, staticAssigneeId, selectedUserIds: userIds })
      }
    />
  );
};

export const FreeForAll: Story = {
  render: () => (
    <InteractiveDemo
      initial={{ ruleType: 'free_for_all', staticAssigneeId: null, selectedUserIds: [] }}
    />
  ),
};

export const RoundRobin: Story = {
  render: () => (
    <InteractiveDemo
      initial={{
        ruleType: 'round_robin',
        staticAssigneeId: null,
        selectedUserIds: ['user-1', 'user-3'],
      }}
    />
  ),
};

export const Static: Story = {
  render: () => (
    <InteractiveDemo
      initial={{ ruleType: 'static', staticAssigneeId: 'user-2', selectedUserIds: [] }}
    />
  ),
};
