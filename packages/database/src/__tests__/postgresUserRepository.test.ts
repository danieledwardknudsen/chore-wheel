import { Client, Pool, PoolClient } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '../schema/index';
import type { DatabaseClient } from '../client';
import { PostgresUserRepository } from './../repositories/postgresUserRepository';

const TEST_URL = process.env['DATABASE_URL_TEST']!;
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../../migrations');

const pool = new Pool({ connectionString: TEST_URL });

beforeAll(async () => {
  const sql = neon(TEST_URL);
  const db = drizzleHttp({ client: sql });
  await migrate(db, { migrationsFolder });
});

let client: PoolClient;
let db: NeonDatabase<typeof schema>;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
  // PoolClient is runtime-compatible with Client but drizzle-orm's types only accept Client.
  db = drizzle({ client: client as unknown as Client, schema });
  // Other suites (e.g. Playwright e2e) share this database and only truncate
  // before their own tests, leaving rows visible to this transaction's reads.
  await db.delete(schema.users);
});

afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();
});

afterAll(async () => {
  await pool.end();
});

const insertUser = async (overrides: Partial<typeof schema.users.$inferInsert> = {}) => {
  const [user] = await db
    .insert(schema.users)
    .values({ name: 'Test User', email: `test-${Math.random()}@example.com`, ...overrides })
    .returning();
  return user!;
};

// NeonDatabase (serverless, transaction-capable) is runtime-compatible with the
// NeonHttpDatabase that DatabaseClient is typed as.
const makeRepo = () => new PostgresUserRepository(db as unknown as DatabaseClient);

describe('PostgresUserRepository.updateProfile', () => {
  it('sets the emoji', async () => {
    const repo = makeRepo();
    const user = await insertUser();

    const updated = await repo.updateProfile(user.id, { emoji: '🎉' });

    expect(updated?.emoji).toBe('🎉');
  });

  it('clears the emoji when set to null', async () => {
    const repo = makeRepo();
    const user = await insertUser({ emoji: '🎉' });

    const updated = await repo.updateProfile(user.id, { emoji: null });

    expect(updated?.emoji).toBeNull();
  });

  it('leaves the emoji untouched when not included in the input', async () => {
    const repo = makeRepo();
    const user = await insertUser({ emoji: '🎉' });

    const updated = await repo.updateProfile(user.id, { name: 'New Name' });

    expect(updated?.emoji).toBe('🎉');
  });

  it('returns null when the user does not exist', async () => {
    const repo = makeRepo();

    const updated = await repo.updateProfile('00000000-0000-0000-0000-000000000000', {
      name: 'New Name',
    });

    expect(updated).toBeNull();
  });
});
