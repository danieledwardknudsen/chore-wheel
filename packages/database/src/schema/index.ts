export * from './users.js';
export * from './passkeys.js';
export * from './phoneVerifications.js';
export * from './choreRules.js';
export * from './choreRuleAssignees.js';
export * from './chores.js';

import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { passkeys } from './passkeys.js';
import { choreRules } from './choreRules.js';
import { choreRuleAssignees } from './choreRuleAssignees.js';
import { chores } from './chores.js';

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
