import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../testing/inMemoryUserRepository';
import type { User } from '../types/user';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  optInEmails: false,
  emoji: null,
  ...overrides,
});

describe('InMemoryUserRepository', () => {
  describe('updateProfile', () => {
    it('updates the given fields and leaves others untouched', async () => {
      const repo = new InMemoryUserRepository([makeUser({ name: 'Old Name' })]);

      const updated = await repo.updateProfile('user-1', { name: 'New Name', emoji: '🎉' });

      expect(updated).toEqual(makeUser({ name: 'New Name', emoji: '🎉' }));
    });

    it('clears the emoji when set to null', async () => {
      const repo = new InMemoryUserRepository([makeUser({ emoji: '🎉' })]);

      const updated = await repo.updateProfile('user-1', { emoji: null });

      expect(updated?.emoji).toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      const repo = new InMemoryUserRepository([makeUser()]);

      const updated = await repo.updateProfile('missing', { name: 'New Name' });

      expect(updated).toBeNull();
    });
  });
});
