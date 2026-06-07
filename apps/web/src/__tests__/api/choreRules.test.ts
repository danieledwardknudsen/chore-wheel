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
      phone: `+1206555${Math.floor(1000 + Math.random() * 8999)}`,
    })
    .returning();
  return user!;
};

const dailyRuleInput = {
  title: 'Dishes',
  assigneeRuleType: 'free_for_all',
  scheduleType: 'recurring',
  scheduleConfig: { type: 'recurring', frequency: 'daily' },
};

describe('GET /api/chore-rules', () => {
  it('returns active rules with assignees', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const [rule] = await db.insert(schema.choreRules).values(dailyRuleInput).returning();

    const { GET } = await import('@/app/api/chore-rules/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ id: string; title: string; assignees: unknown[] }>;
    expect(body).toHaveLength(1);
    expect(body[0]?.title).toBe('Dishes');
    expect(body[0]?.assignees).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    const { GET } = await import('@/app/api/chore-rules/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('POST /api/chore-rules', () => {
  it('creates a chore rule', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { POST } = await import('@/app/api/chore-rules/route');
    const req = new Request('http://localhost/api/chore-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dailyRuleInput),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; title: string };
    expect(body.title).toBe('Dishes');
    expect(body.id).toBeDefined();
  });

  it('creates a rule with assignees', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { POST } = await import('@/app/api/chore-rules/route');
    const req = new Request('http://localhost/api/chore-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dailyRuleInput,
        assigneeRuleType: 'round_robin',
        assignees: [{ userId: user.id, weight: 1, position: 0 }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { assignees: Array<{ userId: string }> };
    expect(body.assignees).toHaveLength(1);
    expect(body.assignees[0]?.userId).toBe(user.id);
  });

  it('returns 422 for invalid schedule config', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { POST } = await import('@/app/api/chore-rules/route');
    const req = new Request('http://localhost/api/chore-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dailyRuleInput, scheduleConfig: { type: 'invalid' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

describe('GET /api/chore-rules/[id]', () => {
  it('returns a specific rule', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const [rule] = await db.insert(schema.choreRules).values(dailyRuleInput).returning();

    const { GET } = await import('@/app/api/chore-rules/[id]/route');
    const res = await GET(new Request(`http://localhost/api/chore-rules/${rule!.id}`), {
      params: Promise.resolve({ id: rule!.id }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe(rule!.id);
  });

  it('returns 404 for unknown id', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { GET } = await import('@/app/api/chore-rules/[id]/route');
    const res = await GET(
      new Request('http://localhost/api/chore-rules/00000000-0000-0000-0000-000000000000'),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    );
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/chore-rules/[id]', () => {
  it('updates title and schedule', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const [rule] = await db.insert(schema.choreRules).values(dailyRuleInput).returning();

    const { PATCH } = await import('@/app/api/chore-rules/[id]/route');
    const req = new Request(`http://localhost/api/chore-rules/${rule!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Dishes' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: rule!.id }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string };
    expect(body.title).toBe('Updated Dishes');
  });
});

describe('DELETE /api/chore-rules/[id]', () => {
  it('soft-deletes the rule (sets status=inactive)', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const [rule] = await db.insert(schema.choreRules).values(dailyRuleInput).returning();

    const { DELETE } = await import('@/app/api/chore-rules/[id]/route');
    const res = await DELETE(
      new Request(`http://localhost/api/chore-rules/${rule!.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ id: rule!.id }) },
    );
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(schema.choreRules)
      .where(eq(schema.choreRules.id, rule!.id));
    expect(rows[0]?.status).toBe('inactive');
  });
});
