import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from '@neondatabase/serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from '@chore-wheel/database';
import { eq } from 'drizzle-orm';
import {
  applyMigrationsOnce,
  createTestTransaction,
  pool,
  rollbackTestTransaction,
} from './auth/dbTestHelpers.js';
import { createSessionCookie, makeCookieHeader } from './auth/testHelpers.js';

let client: PoolClient;
let db: NeonDatabase<typeof schema>;

vi.mock('@/lib/db', () => ({
  get db() {
    return db;
  },
}));

const cookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value !== undefined ? { name, value } : undefined;
    },
    set: (name: string, value: string) => cookieStore.set(name, value),
    delete: (name: string) => cookieStore.delete(name),
    getAll: () => Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
    has: (name: string) => cookieStore.has(name),
  })),
}));

beforeAll(applyMigrationsOnce);

beforeEach(async () => {
  cookieStore.clear();
  ({ db, client } = await createTestTransaction());
});

afterEach(async () => {
  await rollbackTestTransaction(client);
});

afterAll(async () => {
  await pool.end();
});

const setSession = async (userId: string) => {
  const sealed = await createSessionCookie({ userId });
  cookieStore.set('chore-wheel-session', sealed);
};

const insertUser = async (overrides: Partial<typeof schema.users.$inferInsert> = {}) => {
  const [user] = await db
    .insert(schema.users)
    .values({
      name: 'Test User',
      email: `test-${Math.random()}@example.com`,
      ...overrides,
    })
    .returning();
  return user!;
};

describe('GET /api/users/me', () => {
  it('returns the current user', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { GET } = await import('@/app/api/users/me/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body.id).toBe(user.id);
    expect(body.name).toBe(user.name);
  });

  it('returns 401 when not authenticated', async () => {
    const { GET } = await import('@/app/api/users/me/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/users/me', () => {
  it('updates the current user profile', async () => {
    const user = await insertUser({ name: 'Old Name' });
    await setSession(user.id);

    const { PATCH } = await import('@/app/api/users/me/route');
    const req = new Request('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', optInEmails: true }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string; optInEmails: boolean };
    expect(body.name).toBe('New Name');
    expect(body.optInEmails).toBe(true);
  });

  it('returns 422 for invalid input', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { PATCH } = await import('@/app/api/users/me/route');
    const req = new Request('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }), // empty string, fails min(1)
    });

    const res = await PATCH(req);
    expect(res.status).toBe(422);
  });
});

describe('GET /api/users', () => {
  it('returns all users ordered by name', async () => {
    await insertUser({
      name: 'Zebra',
      email: `z${Math.random()}@example.com`,
    });
    await insertUser({
      name: 'Apple',
      email: `a${Math.random()}@example.com`,
    });
    const user = await insertUser({
      name: 'Middle',
      email: `m${Math.random()}@example.com`,
    });
    await setSession(user.id);

    const { GET } = await import('@/app/api/users/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ name: string }>;
    const names = body.map((u) => u.name);
    expect(names).toContain('Apple');
    expect(names).toContain('Zebra');
    expect(names.indexOf('Apple')).toBeLessThan(names.indexOf('Zebra'));
  });
});

describe('DELETE /api/users/me', () => {
  it('deletes the user and destroys the session', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { DELETE } = await import('@/app/api/users/me/route');
    const res = await DELETE();
    expect(res.status).toBe(200);

    // User should no longer exist
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    expect(rows).toHaveLength(0);
  });

  it('unassigns chores and removes rule assignees via FK cascade on delete', async () => {
    const user = await insertUser();
    const [rule] = await db
      .insert(schema.choreRules)
      .values({
        title: 'Test Rule',
        assigneeRuleType: 'round_robin',
        scheduleType: 'recurring',
        scheduleConfig: { type: 'recurring', frequency: 'daily' },
      })
      .returning();

    await db.insert(schema.choreRuleAssignees).values({
      choreRuleId: rule!.id,
      userId: user.id,
      weight: '1.0000',
      position: 0,
    });

    await db.insert(schema.chores).values({
      title: 'My Chore',
      dueDate: '2024-01-15',
      assigneeId: user.id,
    });

    await setSession(user.id);
    const { DELETE } = await import('@/app/api/users/me/route');
    await DELETE();

    // Chore assigneeId should be null (FK set null cascade)
    const choreRows = await db.select().from(schema.chores);
    expect(choreRows[0]?.assigneeId).toBeNull();

    // Assignee row should be gone (FK cascade delete)
    const assigneeRows = await db
      .select()
      .from(schema.choreRuleAssignees)
      .where(eq(schema.choreRuleAssignees.userId, user.id));
    expect(assigneeRows).toHaveLength(0);
  });
});
