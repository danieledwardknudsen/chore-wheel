import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const directory = dirname(fileURLToPath(import.meta.url));
config({ path: join(directory, '../../apps/web/.env.local') });

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env['DATABASE_URL_DIRECT']! },
});
