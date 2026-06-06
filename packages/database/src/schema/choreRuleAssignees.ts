import { integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { choreRules } from './choreRules.js';
import { users } from './users.js';

export const choreRuleAssignees = pgTable('chore_rule_assignees', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreRuleId: uuid('chore_rule_id')
    .notNull()
    .references(() => choreRules.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weight: numeric('weight', { precision: 5, scale: 4 }).notNull().default('1'),
  position: integer('position').notNull(),
});

export type ChoreRuleAssignee = typeof choreRuleAssignees.$inferSelect;
export type NewChoreRuleAssignee = typeof choreRuleAssignees.$inferInsert;
