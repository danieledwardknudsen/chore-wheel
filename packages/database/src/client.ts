import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index.js';

export const createDatabaseClient = (connectionString: string) => {
  const sqlClient = neon(connectionString);
  return drizzle({ client: sqlClient, schema });
};

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
