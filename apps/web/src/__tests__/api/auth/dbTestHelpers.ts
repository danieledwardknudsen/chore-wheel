import { Client, Pool, PoolClient } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import { resolve } from 'path';
import * as schema from '@chore-wheel/database';

const TEST_URL = process.env['DATABASE_URL_TEST']!;

// Resolve from apps/web (vitest root = CWD when running pnpm test)
const MIGRATIONS_FOLDER = resolve('../../packages/database/migrations');

export const pool = new Pool({ connectionString: TEST_URL });

export const applyMigrationsOnce = async () => {
  const sql = neon(TEST_URL);
  const db = drizzleHttp({ client: sql });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
};

export const createTestTransaction = async (): Promise<{
  db: NeonDatabase<typeof schema>;
  client: PoolClient;
}> => {
  const client = await pool.connect();
  await client.query('BEGIN');
  // PoolClient is runtime-compatible with Client but drizzle-orm types only accept Client.
  const db = drizzle({ client: client as unknown as Client, schema });
  return { db, client };
};

export const rollbackTestTransaction = async (client: PoolClient) => {
  await client.query('ROLLBACK');
  client.release();
};
