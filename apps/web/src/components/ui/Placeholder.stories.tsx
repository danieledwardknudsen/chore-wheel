import type { Meta, StoryObj } from '@storybook/react';

const PlaceholderComponent = () => (
  <div
    style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-base)', padding: '1rem' }}
  >
    ┌─── Placeholder ─────────────────────┐
    <br />
    │ Storybook is configured. │
    <br />
    │ Add real components in Phase 07. │
    <br />
    └─────────────────────────────────────┘
  </div>
);

const meta: Meta<typeof PlaceholderComponent> = {
  title: 'UI/Placeholder',
  component: PlaceholderComponent,
};

export default meta;
type Story = StoryObj<typeof PlaceholderComponent>;

export const Default: Story = {};
