import { eq } from 'drizzle-orm';
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

describe('POST /api/auth/send-verification-code', () => {
  it('returns 200 and creates a verification record for a valid phone', async () => {
    const { POST } = await import('@/app/api/auth/send-verification-code/route');
    const request = new Request('http://localhost:3000/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+12065550010' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const records = await db
      .select()
      .from(schema.phoneVerifications)
      .where(eq(schema.phoneVerifications.phone, '+12065550010'));
    expect(records).toHaveLength(1);
    expect(records[0]!.code).toMatch(/^\d{6}$/);
  });

  it('returns 400 for an invalid phone format', async () => {
    const { POST } = await import('@/app/api/auth/send-verification-code/route');
    const request = new Request('http://localhost:3000/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: 'not-a-phone' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/verify-phone-code', () => {
  it('verifies a valid unexpired code', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(schema.phoneVerifications).values({
      phone: '+12065550011',
      code: '999888',
      expiresAt,
    });

    const { POST } = await import('@/app/api/auth/verify-phone-code/route');
    const request = new Request('http://localhost:3000/api/auth/verify-phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+12065550011', code: '999888' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { verified: boolean };
    expect(body.verified).toBe(true);
  });

  it('returns 400 for an incorrect code', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(schema.phoneVerifications).values({
      phone: '+12065550012',
      code: '111111',
      expiresAt,
    });

    const { POST } = await import('@/app/api/auth/verify-phone-code/route');
    const request = new Request('http://localhost:3000/api/auth/verify-phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+12065550012', code: '000000' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for an expired code', async () => {
    const expiresAt = new Date(Date.now() - 1000);
    await db.insert(schema.phoneVerifications).values({
      phone: '+12065550013',
      code: '222222',
      expiresAt,
    });

    const { POST } = await import('@/app/api/auth/verify-phone-code/route');
    const request = new Request('http://localhost:3000/api/auth/verify-phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+12065550013', code: '222222' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
