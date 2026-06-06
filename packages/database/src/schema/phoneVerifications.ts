import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const phoneVerifications = pgTable('phone_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type PhoneVerification = typeof phoneVerifications.$inferSelect;
export type NewPhoneVerification = typeof phoneVerifications.$inferInsert;
