import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { ChoreRuleForm } from '@/components/features/ChoreRuleForm';
import type { RuleFormData, UserJson } from '@/types/api';

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const users: UserJson[] = [
  {
    id: 'user-1',
    name: 'Alice',
    email: 'a@example.com',
    optInEmails: true,
  },
  {
    id: 'user-2',
    name: 'Bob',
    email: 'b@example.com',
    optInEmails: false,
  },
];

describe('ChoreRuleForm', () => {
  it('renders the title input and save button', () => {
    wrap(<ChoreRuleForm users={users} onSubmit={() => {}} loading={false} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('shows a validation error when title is empty on submit', async () => {
    const onSubmit = vi.fn();
    wrap(<ChoreRuleForm users={users} onSubmit={onSubmit} loading={false} />);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when title is filled', async () => {
    const onSubmit = vi.fn();
    wrap(<ChoreRuleForm users={users} onSubmit={onSubmit} loading={false} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Daily dishes' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining<Partial<RuleFormData>>({ title: 'Daily dishes' }),
      );
    });
  });

  it('shows delete button when onDelete is provided', () => {
    wrap(<ChoreRuleForm users={users} onSubmit={() => {}} onDelete={() => {}} loading={false} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not show delete button when onDelete is not provided', () => {
    wrap(<ChoreRuleForm users={users} onSubmit={() => {}} loading={false} />);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('clears title error when user starts typing', async () => {
    wrap(<ChoreRuleForm users={users} onSubmit={() => {}} loading={false} />);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'x' } });
    expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
  });
});
