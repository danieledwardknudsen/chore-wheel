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
  completedAt: null,
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

  it("shows the assignee's emoji next to their name when set", () => {
    wrap(
      <ChoreCard chore={makeChore()} assigneeName="Alice" assigneeEmoji="🎉" onAction={() => {}} />,
    );
    expect(screen.getByText(/🎉 @Alice/)).toBeInTheDocument();
  });

  it("omits the emoji when the assignee hasn't set one", () => {
    wrap(<ChoreCard chore={makeChore()} assigneeName="Alice" onAction={() => {}} />);
    expect(screen.queryByText(/🎉/)).not.toBeInTheDocument();
  });

  it('shows "unassigned" when no assignee', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: null })} onAction={() => {}} />);
    expect(screen.getByText(/unassigned/)).toBeInTheDocument();
  });

  it('shows Complete button for an incomplete chore assigned to the viewer', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: 'user-1' })} onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
  });

  it('shows Complete button for an incomplete chore assigned to someone else', () => {
    wrap(<ChoreCard chore={makeChore({ assigneeId: 'user-2' })} onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
  });

  it('shows Complete button for an unassigned incomplete chore', () => {
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

  it('shows the completion date instead of the due date for a completed chore', () => {
    wrap(
      <ChoreCard
        chore={makeChore({ status: 'complete', completedAt: '2025-01-20' })}
        onAction={() => {}}
      />,
    );
    expect(screen.getByText(/completed 2025-01-20/)).toBeInTheDocument();
    expect(screen.queryByText(/due 2025-01-15/)).not.toBeInTheDocument();
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
    wrap(<ChoreCard chore={makeChore({ assigneeId: 'user-1' })} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/chores/chore-1/cancel', { method: 'PATCH' });
    });
    expect(onAction).toHaveBeenCalled();
  });
});
