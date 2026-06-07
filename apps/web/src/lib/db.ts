import { createDatabaseClient } from '@chore-wheel/database';

export const db = createDatabaseClient(process.env['DATABASE_URL']!);
