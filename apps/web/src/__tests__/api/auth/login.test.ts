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

describe('POST /api/auth/login/start', () => {
  it('returns WebAuthn authentication options for a known user', async () => {
    await db.insert(schema.users).values({
      name: 'Login User',
      email: 'login@example.com',
    });

    const { POST } = await import('@/app/api/auth/login/start/route');
    const request = new Request('http://localhost:3000/api/auth/login/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('challenge');
  });

  it('returns 404 for an unknown email', async () => {
    const { POST } = await import('@/app/api/auth/login/start/route');
    const request = new Request('http://localhost:3000/api/auth/login/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});

describe('POST /api/auth/logout', () => {
  it('destroys the session and returns 200', async () => {
    const { POST } = await import('@/app/api/auth/logout/route');
    const request = new Request('http://localhost:3000/api/auth/logout', { method: 'POST' });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
