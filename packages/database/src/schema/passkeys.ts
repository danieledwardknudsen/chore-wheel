import { bigint, boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const passkeys = pgTable('passkeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).notNull().default(0),
  transports: text('transports').array(),
  deviceType: varchar('device_type', { length: 32 }),
  backedUp: boolean('backed_up').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Passkey = typeof passkeys.$inferSelect;
export type NewPasskey = typeof passkeys.$inferInsert;
