import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const choreRules = pgTable('chore_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  assigneeRuleType: varchar('assignee_rule_type', { length: 20 }).notNull(),
  staticAssigneeId: uuid('static_assignee_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  scheduleType: varchar('schedule_type', { length: 20 }).notNull(),
  scheduleConfig: jsonb('schedule_config').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ChoreRule = typeof choreRules.$inferSelect;
export type NewChoreRule = typeof choreRules.$inferInsert;
