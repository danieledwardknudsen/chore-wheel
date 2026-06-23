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
import { PostgresChoreRepository } from './../repositories/postgresChoreRepository';

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
});

afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();
});

afterAll(async () => {
  await pool.end();
});

const insertChore = async (status: string, completedAt: Date | null) => {
  const [chore] = await db
    .insert(schema.chores)
    .values({ title: 'Test Chore', dueDate: '2024-06-15', status, completedAt })
    .returning();
  return chore!;
};

// NeonDatabase (serverless, transaction-capable) is runtime-compatible with the
// NeonHttpDatabase that DatabaseClient is typed as.
const makeRepo = () => new PostgresChoreRepository(db as unknown as DatabaseClient);

describe('PostgresChoreRepository.findRecentlyCompleted', () => {
  it('returns only completed chores, most recently completed first', async () => {
    const repo = makeRepo();
    const oldest = await insertChore('complete', new Date('2024-01-01'));
    await insertChore('incomplete', null);
    const newest = await insertChore('complete', new Date('2024-03-01'));
    const middle = await insertChore('complete', new Date('2024-02-01'));

    const result = await repo.findRecentlyCompleted(10);

    expect(result.map((c) => c.id)).toEqual([newest.id, middle.id, oldest.id]);
  });

  it('caps the result at the given limit', async () => {
    const repo = makeRepo();
    await insertChore('complete', new Date('2024-01-01'));
    await insertChore('complete', new Date('2024-01-02'));
    const newest = await insertChore('complete', new Date('2024-01-03'));

    const result = await repo.findRecentlyCompleted(1);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(newest.id);
  });

  it('sorts a completed chore with no completedAt (e.g. pre-existing data) last, not first', async () => {
    const repo = makeRepo();
    const legacy = await insertChore('complete', null);
    const recent = await insertChore('complete', new Date('2024-01-01'));

    const result = await repo.findRecentlyCompleted(10);

    expect(result.map((c) => c.id)).toEqual([recent.id, legacy.id]);
  });
});

describe('PostgresChoreRepository.updateStatus', () => {
  it('stamps completedAt when transitioning to complete', async () => {
    const repo = makeRepo();
    const chore = await insertChore('incomplete', null);

    await repo.updateStatus(chore.id, 'complete');

    const [updated] = await repo.findRecentlyCompleted(10);
    expect(updated?.id).toBe(chore.id);
    expect(updated?.completedAt).not.toBeNull();
  });

  it('does not stamp completedAt when transitioning to expired', async () => {
    const repo = makeRepo();
    const chore = await insertChore('incomplete', null);

    await repo.updateStatus(chore.id, 'expired');

    const completed = await repo.findRecentlyCompleted(10);
    expect(completed.find((c) => c.id === chore.id)).toBeUndefined();
  });

  it('does not re-stamp completedAt when completing an already-complete chore', async () => {
    const repo = makeRepo();
    const original = new Date('2024-01-01T00:00:00Z');
    const chore = await insertChore('complete', original);

    await repo.updateStatus(chore.id, 'complete');

    const [updated] = await repo.findRecentlyCompleted(10);
    expect(updated?.completedAt?.toISOString()).toBe(original.toISOString());
  });
});
