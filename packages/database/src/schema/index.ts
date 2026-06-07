export * from './users';
export * from './passkeys';
export * from './phoneVerifications';
export * from './choreRules';
export * from './choreRuleAssignees';
export * from './chores';

import { relations } from 'drizzle-orm';
import { users } from './users';
import { passkeys } from './passkeys';
import { choreRules } from './choreRules';
import { choreRuleAssignees } from './choreRuleAssignees';
import { chores } from './chores';

export const usersRelations = relations(users, ({ many, one: _one }) => ({
  passkeys: many(passkeys),
  choreRuleAssignees: many(choreRuleAssignees),
  assignedChores: many(chores, { relationName: 'assignee' }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, { fields: [passkeys.userId], references: [users.id] }),
}));

export const choreRulesRelations = relations(choreRules, ({ many, one }) => ({
  assignees: many(choreRuleAssignees),
  chores: many(chores),
  staticAssignee: one(users, {
    fields: [choreRules.staticAssigneeId],
    references: [users.id],
  }),
}));

export const choreRuleAssigneesRelations = relations(choreRuleAssignees, ({ one }) => ({
  choreRule: one(choreRules, {
    fields: [choreRuleAssignees.choreRuleId],
    references: [choreRules.id],
  }),
  user: one(users, { fields: [choreRuleAssignees.userId], references: [users.id] }),
}));

export const choresRelations = relations(chores, ({ one }) => ({
  assignee: one(users, {
    fields: [chores.assigneeId],
    references: [users.id],
    relationName: 'assignee',
  }),
  choreRule: one(choreRules, {
    fields: [chores.choreRuleId],
    references: [choreRules.id],
  }),
}));
