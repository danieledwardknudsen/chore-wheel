import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { ChoreCard } from '@/components/features/ChoreCard';
import type { ChoreJson } from '@/types/api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const makeChore = (overrides: Partial<ChoreJson> = {}): ChoreJson => ({
  id: 'chore-1',
  title: 'Wash dishes',
  status: 'incomplete',
  dueDate: '2025-01-15',
  assigneeId: 'user-1',
  choreRuleId: null,
  createdAt: '2025-01-10T00:00:00Z',
  ...overrides,
});

describe('ChoreCard', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chore title and status badge', () => {
    wrap(<ChoreCard chore={makeChore()} onAction={() => {}} />);
    expect(screen.getByText('Wash dishes')).toBeInTheDocument();
    expect(screen.getByText('[PENDING]')).toBeInTheDocument();
  });

  it('shows due date', () => {
    wrap(<ChoreCard chore={makeChore()} onAction={() => {}} />);
    expect(screen.getByText(/2025-01-15/)).toBeInTheDocument();
  });

  it('shows assignee name when provided', () => {
    wrap(<ChoreCard chore={makeChore()} assigneeName="Alice" onAction={() => {}} />);
    expect(screen.getByText(/@Alice/)).toBeInTheDocument();
  });

  it('shows "unassigned" when no assignee', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: null })} onAction={() => {}} />);
    expect(screen.getByText(/unassigned/)).toBeInTheDocument();
  });

  it('shows Complete button for any incomplete chore, regardless of assignee', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: 'user-2' })} onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
  });

  it('shows Complete button for an unassigned chore', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: null })} onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
  });

  it('shows Cancel button for any incomplete chore', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: 'user-2' })} onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows no action buttons for completed chore', () => {
    wrap(<ChoreCard chore={makeChore({ status: 'complete' })} onAction={() => {}} />);
    expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('shows no action buttons for expired chore', () => {
    wrap(<ChoreCard chore={makeChore({ status: 'expired' })} onAction={() => {}} />);
    expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('calls fetch with correct URL when Complete is clicked', async () => {
    const onAction = vi.fn();
    wrap(<ChoreCard chore={makeChore({ assigneeId: 'user-2' })} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: /complete/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/chores/chore-1/complete', { method: 'PATCH' });
    });
    expect(onAction).toHaveBeenCalled();
  });

  it('calls fetch with correct URL when Cancel is clicked', async () => {
    const onAction = vi.fn();
    wrap(<ChoreCard chore={makeChore()} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/chores/chore-1/cancel', { method: 'PATCH' });
    });
    expect(onAction).toHaveBeenCalled();
  });
});
