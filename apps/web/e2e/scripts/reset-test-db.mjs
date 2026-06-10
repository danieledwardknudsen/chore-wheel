// Standalone DB reset for e2e tests. Run via plain `node` (NOT through
// Playwright's esbuild transform) so @neondatabase/serverless's CJS internals
// resolve correctly. Drops the public schema for a guaranteed-clean slate, then
// re-applies all Drizzle migrations from scratch.
import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../.env.local') });

const dbUrl = process.env.DATABASE_URL_TEST;
if (!dbUrl) {
  console.error('DATABASE_URL_TEST is not set in apps/web/.env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

const main = async () => {
  // Clean slate. The `drizzle` schema holds the applied-migration log
  // (drizzle.__drizzle_migrations); dropping it too forces every migration to
  // re-apply from scratch, so the schema always matches the migration files.
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await sql`CREATE SCHEMA public`;

  const db = drizzle({ client: sql });
  // here = apps/web/e2e/scripts → four levels up is the repo root.
  const repoRoot = resolve(here, '../../../..');
  await migrate(db, { migrationsFolder: join(repoRoot, 'packages/database/migrations') });

  console.log('[e2e] Test DB reset and migrated');
};

main().catch((error) => {
  console.error('[e2e] reset-test-db failed:', error);
  process.exit(1);
});
