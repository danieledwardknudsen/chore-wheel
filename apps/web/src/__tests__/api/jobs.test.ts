import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from '@neondatabase/serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from '@chore-wheel/database';
import {
  applyMigrationsOnce,
  createTestTransaction,
  pool,
  rollbackTestTransaction,
} from './auth/dbTestHelpers.js';
import { createSessionCookie } from './auth/testHelpers.js';

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
  await db.delete(schema.choreRuleAssignees);
  await db.delete(schema.chores);
  await db.delete(schema.choreRules);
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

const insertUser = async () => {
  const [user] = await db
    .insert(schema.users)
    .values({
      name: 'Test',
      email: `t${Math.random()}@x.com`,
    })
    .returning();
  return user!;
};

describe('POST /api/jobs/run', () => {
  it('returns 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/jobs/run/route');
    const req = new Request('http://localhost/api/jobs/run?disableMessages=true', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates chores for active daily rules and returns job result', async () => {
    const user = await insertUser();
    await setSession(user.id);

    await db.insert(schema.choreRules).values({
      title: 'Daily Dishes',
      assigneeRuleType: 'free_for_all',
      scheduleType: 'recurring',
      scheduleConfig: { type: 'recurring', frequency: 'daily' },
    });

    const { POST } = await import('@/app/api/jobs/run/route');
    const req = new Request('http://localhost/api/jobs/run?disableMessages=true', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { createdCount: number; expiredCount: number };
    expect(body.createdCount).toBe(1);
  });

  it('is idempotent — running twice does not duplicate chores', async () => {
    const user = await insertUser();
    await setSession(user.id);

    await db.insert(schema.choreRules).values({
      title: 'Daily Dishes',
      assigneeRuleType: 'free_for_all',
      scheduleType: 'recurring',
      scheduleConfig: { type: 'recurring', frequency: 'daily' },
    });

    const { POST } = await import('@/app/api/jobs/run/route');
    const config = { method: 'POST' };

    await POST(new Request('http://localhost/api/jobs/run?disableMessages=true', config));
    const res2 = await POST(
      new Request('http://localhost/api/jobs/run?disableMessages=true', config),
    );
    const body = (await res2.json()) as { createdCount: number };
    expect(body.createdCount).toBe(0);
  });

  it('expires stale incomplete chores', async () => {
    const user = await insertUser();
    await setSession(user.id);

    // Insert a chore due 9 days ago
    await db.insert(schema.chores).values({
      title: 'Old Chore',
      dueDate: '2024-06-08', // 9 days before 2024-06-17
      status: 'incomplete',
    });

    // Mock today to a known date using env var override isn't possible here,
    // so we verify the job returns expiredCount > 0 when there are stale chores.
    // The job uses new Date() internally; since this runs "today," we verify
    // by checking the chore is now expired after the fact.
    const { POST } = await import('@/app/api/jobs/run/route');
    const req = new Request('http://localhost/api/jobs/run?disableMessages=true', {
      method: 'POST',
    });
    const res = await POST(req);
    const body = (await res.json()) as { expiredCount: number };
    // The chore was due 2024-06-08 and today is well past that + 7 days, so it should expire.
    expect(body.expiredCount).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/jobs/assign-chores', () => {
  it('returns 401 without cron secret', async () => {
    const { GET } = await import('@/app/api/jobs/assign-chores/route');
    const req = new Request('http://localhost/api/jobs/assign-chores');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong cron secret', async () => {
    process.env['CRON_SECRET'] = 'correct-secret';
    const { GET } = await import('@/app/api/jobs/assign-chores/route');
    const req = new Request('http://localhost/api/jobs/assign-chores', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with correct cron secret', async () => {
    process.env['CRON_SECRET'] = 'correct-secret';
    const { GET } = await import('@/app/api/jobs/assign-chores/route');
    const req = new Request('http://localhost/api/jobs/assign-chores', {
      headers: { Authorization: 'Bearer correct-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
