# Phase 02 — Database Schema

**Goal:** Drizzle ORM schema with all tables defined, migrations applied to Neon, and typed query helpers exported. Integration tests confirm tables exist and basic CRUD works.

**Prerequisites:** Phase 01 complete. Neon project created; `DATABASE_URL`, `DATABASE_URL_TEST`, `DATABASE_URL_DIRECT` set in `.env.local`.

---

## Package: `packages/database`

### 2.1 — Install dependencies

```
cd packages/database
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit dotenv
```

### 2.2 — Schema definitions

`packages/database/src/schema/users.ts`:

```ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  optInTexts: boolean('opt_in_texts').notNull().default(true),
  optInEmails: boolean('opt_in_emails').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

`packages/database/src/schema/passkeys.ts`:

```ts
export const passkeys = pgTable('passkeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(), // base64url-encoded CBOR
  counter: bigint('counter', { mode: 'number' }).notNull().default(0),
  transports: text('transports').array(), // ['internal', 'hybrid', …]
  deviceType: varchar('device_type', { length: 32 }),
  backedUp: boolean('backed_up').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

`packages/database/src/schema/phoneVerifications.ts`:

```ts
export const phoneVerifications = pgTable('phone_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

`packages/database/src/schema/choreRules.ts`:

```ts
// assigneeRuleType: 'static' | 'round_robin' | 'free_for_all'
// scheduleType: 'one_off' | 'recurring'
// scheduleConfig is JSONB — shape validated at application layer with Zod

export const choreRules = pgTable('chore_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  assigneeRuleType: varchar('assignee_rule_type', { length: 20 }).notNull(),
  staticAssigneeId: uuid('static_assignee_id').references(() => users.id, { onDelete: 'set null' }),
  scheduleType: varchar('schedule_type', { length: 20 }).notNull(),
  scheduleConfig: jsonb('schedule_config').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

`packages/database/src/schema/choreRuleAssignees.ts`:

```ts
// Stores the ordered list + weights for round-robin rules
export const choreRuleAssignees = pgTable('chore_rule_assignees', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreRuleId: uuid('chore_rule_id')
    .notNull()
    .references(() => choreRules.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weight: numeric('weight', { precision: 5, scale: 4 }).notNull().default('1'),
  position: integer('position').notNull(), // sort order within the cycle
});
```

`packages/database/src/schema/chores.ts`:

```ts
// status: 'incomplete' | 'complete' | 'expired' | 'canceled'
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
```

`packages/database/src/schema/index.ts` — re-exports all tables + defines Drizzle relations.

### 2.3 — Drizzle config

`packages/database/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT! },
});
```

### 2.4 — Migration workflow

Generate: `pnpm drizzle-kit generate`
Apply: `pnpm drizzle-kit migrate`

Add scripts to `package.json`:

- `"db:generate": "drizzle-kit generate"`
- `"db:migrate": "drizzle-kit migrate"`
- `"db:studio": "drizzle-kit studio"`

### 2.5 — DB client helper

`packages/database/src/client.ts`:

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index.js';

export const createDatabaseClient = (connectionString: string) => {
  const sqlClient = neon(connectionString);
  return drizzle(sqlClient, { schema });
};
```

### 2.6 — Zod validation schemas

`packages/database/src/validation/choreRuleScheduleConfig.ts` — Zod union for one-off vs recurring schedule configs.
`packages/database/src/validation/choreRuleAssigneeRule.ts` — Zod discriminated union for the three assignee rule types.

These are used in API routes to validate incoming request bodies before writing to DB.

### 2.7 — Integration tests

`packages/database/src/__tests__/schema.test.ts`:

- Connects to `DATABASE_URL_TEST`.
- Inserts a user, a chore rule, and a chore; reads them back.
- Verifies foreign key cascade (deleting a user cascades to passkeys, chores).
- Runs inside a transaction that is rolled back after each test (`beforeEach`/`afterEach`).

---

## Test Checklist

- [ ] `pnpm --filter @chore-wheel/database db:generate` creates migration files.
- [ ] `pnpm --filter @chore-wheel/database db:migrate` applies migrations to Neon without errors.
- [ ] `pnpm --filter @chore-wheel/database test` passes all integration tests.
- [ ] TypeScript types inferred from schema compile without errors.

---

## Commit Message

`feat(database): add Drizzle schema, migrations, and client for all core tables`
