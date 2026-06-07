import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

const meta: Meta = { title: 'Primitives' };
export default meta;

const BoxDemo = () => {
  const {
    primitives: { Box },
  } = useTheme();
  return (
    <div style={{ maxWidth: 400 }}>
      <Box title="SAMPLE BOX">
        <p style={{ margin: 0, color: 'var(--color-text)', fontFamily: 'inherit' }}>
          Content inside the box.
        </p>
      </Box>
    </div>
  );
};
export const Box: StoryObj = { render: () => <BoxDemo /> };

const ButtonsDemo = () => {
  const {
    primitives: { Button },
  } = useTheme();
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary" size="md" onClick={() => {}}>
        Primary md
      </Button>
      <Button variant="ghost" size="md" onClick={() => {}}>
        Ghost md
      </Button>
      <Button variant="danger" size="md" onClick={() => {}}>
        Danger md
      </Button>
      <Button variant="primary" size="sm" onClick={() => {}}>
        Primary sm
      </Button>
      <Button variant="primary" size="md" loading onClick={() => {}}>
        Loading
      </Button>
      <Button variant="primary" size="md" disabled onClick={() => {}}>
        Disabled
      </Button>
    </div>
  );
};
export const Buttons: StoryObj = { render: () => <ButtonsDemo /> };

const InputDemo = () => {
  const {
    primitives: { Input },
  } = useTheme();
  const [val, setVal] = useState('');
  return (
    <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input
        label="Username"
        name="username"
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Enter text..."
      />
      <Input
        label="With error"
        name="errored"
        type="text"
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    </div>
  );
};
export const InputField: StoryObj = { render: () => <InputDemo /> };

const LabelDemo = () => {
  const {
    primitives: { Label },
  } = useTheme();
  return <Label htmlFor="example">Example label</Label>;
};
export const LabelPrimitive: StoryObj = { name: 'Label', render: () => <LabelDemo /> };

const BadgesDemo = () => {
  const {
    primitives: { Badge },
  } = useTheme();
  const statuses = ['incomplete', 'complete', 'expired', 'canceled', 'active', 'inactive'] as const;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {statuses.map((s) => (
        <Badge key={s} status={s} />
      ))}
    </div>
  );
};
export const Badges: StoryObj = { render: () => <BadgesDemo /> };

const ModalDemo = () => {
  const {
    primitives: { Modal, Button },
  } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="CONFIRM ACTION">
        <p style={{ color: 'var(--color-text)', fontFamily: 'inherit', marginBottom: '1rem' }}>
          Are you sure you want to proceed?
        </p>
        <Button variant="danger" size="sm" onClick={() => setOpen(false)}>
          Confirm
        </Button>
      </Modal>
    </div>
  );
};
export const ModalPrimitive: StoryObj = { name: 'Modal', render: () => <ModalDemo /> };

const SpinnerDemo = () => {
  const {
    primitives: { Spinner },
  } = useTheme();
  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <Spinner />
      <Spinner label="Loading..." />
    </div>
  );
};
export const SpinnerPrimitive: StoryObj = { name: 'Spinner', render: () => <SpinnerDemo /> };

const ToastsDemo = () => {
  const {
    primitives: { Toast },
  } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 360 }}>
      <Toast type="success" message="Chore marked complete." />
      <Toast type="error" message="Failed to save changes." />
      <Toast type="info" message="Reminder sent to assignee." />
    </div>
  );
};
export const Toasts: StoryObj = { render: () => <ToastsDemo /> };

const ToggleDemo = () => {
  const {
    primitives: { Toggle },
  } = useTheme();
  const [checked, setChecked] = useState(false);
  return <Toggle checked={checked} onChange={setChecked} label="Receive SMS notifications" />;
};
export const TogglePrimitive: StoryObj = { name: 'Toggle', render: () => <ToggleDemo /> };

const TabsDemo = () => {
  const {
    primitives: { Tabs },
  } = useTheme();
  const [active, setActive] = useState('chores');
  const tabs = [
    { key: 'chores', label: 'Chores' },
    { key: 'rules', label: 'Rules' },
    { key: 'profile', label: 'Profile' },
  ];
  return <Tabs tabs={tabs} activeKey={active} onChange={setActive} />;
};
export const TabsPrimitive: StoryObj = { name: 'Tabs', render: () => <TabsDemo /> };

const UserChipDemo = () => {
  const {
    primitives: { UserChip },
  } = useTheme();
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <UserChip user={{ id: '1', name: 'Alice' }} onClick={() => {}} />
      <UserChip user={{ id: '2', name: 'Bob' }} />
    </div>
  );
};
export const UserChipPrimitive: StoryObj = { name: 'UserChip', render: () => <UserChipDemo /> };
