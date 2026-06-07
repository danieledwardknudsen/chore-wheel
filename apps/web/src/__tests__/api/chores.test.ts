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
      name: 'Test',
      email: `t${Math.random()}@x.com`,
      phone: `+1206557${Math.floor(1000 + Math.random() * 8999)}`,
      ...overrides,
    })
    .returning();
  return user!;
};

const insertChore = async (assigneeId: string | null = null, status = 'incomplete') => {
  const [chore] = await db
    .insert(schema.chores)
    .values({ title: 'Test Chore', dueDate: '2024-06-15', assigneeId, status })
    .returning();
  return chore!;
};

describe('GET /api/chores', () => {
  it('returns all incomplete/expired chores by default', async () => {
    const user = await insertUser();
    await setSession(user.id);
    await insertChore(user.id);
    await insertChore(null);

    const { GET } = await import('@/app/api/chores/route');
    const req = new Request('http://localhost/api/chores');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body.length).toBeGreaterThanOrEqual(2);
  });

  it('returns only the current user chores with section=mine', async () => {
    const user = await insertUser();
    const other = await insertUser({
      email: `o${Math.random()}@x.com`,
      phone: `+1206558${Math.floor(1000 + Math.random() * 8999)}`,
    });
    await setSession(user.id);
    await insertChore(user.id);
    await insertChore(other.id);

    const { GET } = await import('@/app/api/chores/route');
    const req = new Request('http://localhost/api/chores?section=mine');
    const res = await GET(req);
    const body = (await res.json()) as Array<{ assigneeId: string }>;
    expect(body.every((c) => c.assigneeId === user.id)).toBe(true);
  });

  it('returns unassigned chores with section=unassigned', async () => {
    const user = await insertUser();
    await setSession(user.id);
    await insertChore(null);
    await insertChore(user.id);

    const { GET } = await import('@/app/api/chores/route');
    const req = new Request('http://localhost/api/chores?section=unassigned');
    const res = await GET(req);
    const body = (await res.json()) as Array<{ assigneeId: null }>;
    expect(body.every((c) => c.assigneeId === null)).toBe(true);
  });
});

describe('POST /api/chores', () => {
  it('creates a one-off chore', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { POST } = await import('@/app/api/chores/route');
    const req = new Request('http://localhost/api/chores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Clean oven', dueDate: '2024-07-01' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { title: string; status: string };
    expect(body.title).toBe('Clean oven');
    expect(body.status).toBe('incomplete');
  });

  it('returns 422 for missing dueDate', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { POST } = await import('@/app/api/chores/route');
    const req = new Request('http://localhost/api/chores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No date' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

describe('GET /api/chores/[id]', () => {
  it('returns a specific chore', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const chore = await insertChore(user.id);

    const { GET } = await import('@/app/api/chores/[id]/route');
    const res = await GET(new Request(`http://localhost/api/chores/${chore.id}`), {
      params: Promise.resolve({ id: chore.id }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe(chore.id);
  });

  it('returns 404 for unknown id', async () => {
    const user = await insertUser();
    await setSession(user.id);

    const { GET } = await import('@/app/api/chores/[id]/route');
    const res = await GET(
      new Request('http://localhost/api/chores/00000000-0000-0000-0000-000000000000'),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    );
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/chores/[id]/complete', () => {
  it('marks chore as complete', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const chore = await insertChore(user.id);

    const { PATCH } = await import('@/app/api/chores/[id]/complete/route');
    const res = await PATCH(
      new Request(`http://localhost/api/chores/${chore.id}/complete`, { method: 'PATCH' }),
      { params: Promise.resolve({ id: chore.id }) },
    );
    expect(res.status).toBe(200);

    const rows = await db.select().from(schema.chores).where(eq(schema.chores.id, chore.id));
    expect(rows[0]?.status).toBe('complete');
  });
});

describe('PATCH /api/chores/[id]/cancel', () => {
  it('marks chore as canceled', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const chore = await insertChore();

    const { PATCH } = await import('@/app/api/chores/[id]/cancel/route');
    const res = await PATCH(
      new Request(`http://localhost/api/chores/${chore.id}/cancel`, { method: 'PATCH' }),
      { params: Promise.resolve({ id: chore.id }) },
    );
    expect(res.status).toBe(200);

    const rows = await db.select().from(schema.chores).where(eq(schema.chores.id, chore.id));
    expect(rows[0]?.status).toBe('canceled');
  });
});

describe('PATCH /api/chores/[id]/reassign', () => {
  it('reassigns a chore to another user', async () => {
    const user = await insertUser();
    const other = await insertUser({
      email: `ot${Math.random()}@x.com`,
      phone: `+1206559${Math.floor(1000 + Math.random() * 8999)}`,
    });
    await setSession(user.id);
    const chore = await insertChore(user.id);

    const { PATCH } = await import('@/app/api/chores/[id]/reassign/route');
    const req = new Request(`http://localhost/api/chores/${chore.id}/reassign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: other.id }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: chore.id }) });
    expect(res.status).toBe(200);

    const rows = await db.select().from(schema.chores).where(eq(schema.chores.id, chore.id));
    expect(rows[0]?.assigneeId).toBe(other.id);
  });

  it('unassigns a chore when assigneeId is null', async () => {
    const user = await insertUser();
    await setSession(user.id);
    const chore = await insertChore(user.id);

    const { PATCH } = await import('@/app/api/chores/[id]/reassign/route');
    const req = new Request(`http://localhost/api/chores/${chore.id}/reassign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: null }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: chore.id }) });
    expect(res.status).toBe(200);

    const rows = await db.select().from(schema.chores).where(eq(schema.chores.id, chore.id));
    expect(rows[0]?.assigneeId).toBeNull();
  });
});
