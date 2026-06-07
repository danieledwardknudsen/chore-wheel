import { date, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { choreRules } from './choreRules';
import { users } from './users';

export const chores = pgTable('chores', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('incomplete'),
  dueDate: date('due_date').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  choreRuleId: uuid('chore_rule_id').references(() => choreRules.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Chore = typeof chores.$inferSelect;
export type NewChore = typeof chores.$inferInsert;
