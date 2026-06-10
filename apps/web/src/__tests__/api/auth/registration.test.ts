import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from '@neondatabase/serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from '@chore-wheel/database';
import {
  applyMigrationsOnce,
  createTestTransaction,
  pool,
  rollbackTestTransaction,
} from './dbTestHelpers.js';

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
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
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

describe('POST /api/auth/registration/start', () => {
  it('creates a user and returns WebAuthn registration options', async () => {
    const { POST } = await import('@/app/api/auth/registration/start/route');
    const request = new Request('http://localhost:3000/api/auth/registration/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('challenge');
    expect(body).toHaveProperty('rp');
    expect(body).toHaveProperty('user');
  });

  it('returns 409 when email is already registered', async () => {
    await db.insert(schema.users).values({
      name: 'Existing',
      email: 'existing@example.com',
    });

    const { POST } = await import('@/app/api/auth/registration/start/route');
    const request = new Request('http://localhost:3000/api/auth/registration/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another', email: 'existing@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
  });

  it('returns 400 for missing fields', async () => {
    const { POST } = await import('@/app/api/auth/registration/start/route');
    const request = new Request('http://localhost:3000/api/auth/registration/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Email' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
