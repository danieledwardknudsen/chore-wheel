import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProfileForm } from '@/app/profile/ProfileForm';
import type { UserJson } from '@/types/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const wrap = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const makeUser = (overrides: Partial<UserJson> = {}): UserJson => ({
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  optInEmails: false,
  emoji: null,
  ...overrides,
});

describe('ProfileForm', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the current emoji value', () => {
    wrap(<ProfileForm user={makeUser({ emoji: '🎉' })} />);
    expect(screen.getByLabelText('Emoji')).toHaveValue('🎉');
  });

  it('shows an empty emoji field when none is set', () => {
    wrap(<ProfileForm user={makeUser()} />);
    expect(screen.getByLabelText('Emoji')).toHaveValue('');
  });

  it('sends the updated emoji on save', async () => {
    wrap(<ProfileForm user={makeUser()} />);

    fireEvent.change(screen.getByLabelText('Emoji'), { target: { value: '🎉' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Alice', optInEmails: false, emoji: '🎉' }),
        }),
      );
    });
  });
});
