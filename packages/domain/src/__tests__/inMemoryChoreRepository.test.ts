import { describe, expect, it } from 'vitest';
import { InMemoryChoreRepository } from '../testing/inMemoryChoreRepository';
import type { Chore } from '../types/chore';

const makeChore = (overrides: Partial<Chore> = {}): Chore => ({
  id: 'chore-1',
  title: 'Test Chore',
  status: 'incomplete',
  dueDate: new Date('2024-01-01'),
  assigneeId: null,
  choreRuleId: null,
  createdAt: new Date('2024-01-01'),
  completedAt: null,
  ...overrides,
});

describe('InMemoryChoreRepository', () => {
  describe('updateStatus', () => {
    it('stamps completedAt when transitioning to complete', async () => {
      const repo = new InMemoryChoreRepository([makeChore({ id: 'chore-1' })]);
      await repo.updateStatus('chore-1', 'complete');

      const [chore] = await repo.findRecentlyCompleted(10);
      expect(chore?.completedAt).not.toBeNull();
    });

    it('does not stamp completedAt when transitioning to expired or canceled', async () => {
      const repo = new InMemoryChoreRepository([
        makeChore({ id: 'chore-1' }),
        makeChore({ id: 'chore-2' }),
      ]);
      await repo.updateStatus('chore-1', 'expired');
      await repo.updateStatus('chore-2', 'canceled');

      const completed = await repo.findRecentlyCompleted(10);
      expect(completed).toHaveLength(0);
    });

    it('does not re-stamp completedAt when completing an already-complete chore', async () => {
      const original = new Date('2024-01-01');
      const repo = new InMemoryChoreRepository([
        makeChore({ id: 'chore-1', status: 'complete', completedAt: original }),
      ]);

      await repo.updateStatus('chore-1', 'complete');

      const [chore] = await repo.findRecentlyCompleted(10);
      expect(chore?.completedAt).toEqual(original);
    });
  });

  describe('findRecentlyCompleted', () => {
    it('returns only completed chores, most recently completed first', async () => {
      const repo = new InMemoryChoreRepository([
        makeChore({ id: 'oldest', completedAt: new Date('2024-01-01'), status: 'complete' }),
        makeChore({ id: 'incomplete-one', status: 'incomplete' }),
        makeChore({ id: 'newest', completedAt: new Date('2024-03-01'), status: 'complete' }),
        makeChore({ id: 'middle', completedAt: new Date('2024-02-01'), status: 'complete' }),
      ]);

      const result = await repo.findRecentlyCompleted(10);

      expect(result.map((c) => c.id)).toEqual(['newest', 'middle', 'oldest']);
    });

    it('caps the result at the given limit', async () => {
      const repo = new InMemoryChoreRepository([
        makeChore({ id: 'a', completedAt: new Date('2024-01-01'), status: 'complete' }),
        makeChore({ id: 'b', completedAt: new Date('2024-01-02'), status: 'complete' }),
        makeChore({ id: 'c', completedAt: new Date('2024-01-03'), status: 'complete' }),
      ]);

      const result = await repo.findRecentlyCompleted(2);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toEqual(['c', 'b']);
    });

    it('sorts a completed chore with no completedAt (e.g. pre-existing data) last, not first', async () => {
      const repo = new InMemoryChoreRepository([
        makeChore({ id: 'legacy-no-timestamp', status: 'complete', completedAt: null }),
        makeChore({ id: 'recent', completedAt: new Date('2024-01-01'), status: 'complete' }),
      ]);

      const result = await repo.findRecentlyCompleted(10);

      expect(result.map((c) => c.id)).toEqual(['recent', 'legacy-no-timestamp']);
    });
  });
});
