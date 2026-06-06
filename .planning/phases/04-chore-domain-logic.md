# Phase 04 — Chore Domain Logic

**Goal:** Fully tested pure-logic package. No I/O dependencies. All scheduling math and assignment calculations are correct. The batch job orchestrator is wired to abstract interfaces.

**Prerequisites:** Phase 02 complete (for schema types; no DB calls in this package).

---

## Package: `packages/domain`

### Abstract Interfaces

`packages/domain/src/interfaces/choreRuleRepository.ts`:

```ts
export interface ChoreRuleRepository {
  findAllActive(): Promise<ChoreRule[]>;
  findById(id: string): Promise<ChoreRule | null>;
  findAssigneesForRule(ruleId: string): Promise<ChoreRuleAssignee[]>;
  findRecentAssignmentsForRule(ruleId: string, lookbackCount: number): Promise<ChoreAssignment[]>;
}
```

`packages/domain/src/interfaces/choreRepository.ts`:

```ts
export interface ChoreRepository {
  findExistingForRuleAndDate(ruleId: string, dueDate: Date): Promise<Chore | null>;
  findOverdueIncomplete(thresholdDate: Date): Promise<Chore[]>;
  createChore(input: CreateChoreInput): Promise<Chore>;
  updateStatus(id: string, status: ChoreStatus): Promise<void>;
  findAllIncompleteAndExpired(): Promise<Chore[]>;
}
```

`packages/domain/src/interfaces/userRepository.ts`:

```ts
export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findUsersWithTextOptIn(): Promise<User[]>;
  findUsersWithEmailOptIn(): Promise<User[]>;
}
```

`packages/domain/src/interfaces/notificationSink.ts`:

```ts
export interface NotificationSink {
  sendDailySummary(
    user: User,
    assignedChores: Chore[],
    unassignedChores: Chore[],
    websiteUrl: string,
  ): Promise<void>;
}
```

---

### Domain Types

`packages/domain/src/types/choreRule.ts` — ChoreRule, AssigneeRule variants, Schedule variants, ChoreRuleAssignee, ChoreAssignment.

`packages/domain/src/types/chore.ts` — Chore, ChoreStatus, CreateChoreInput.

`packages/domain/src/types/user.ts` — User (id, name, email, phone, optInTexts, optInEmails).

---

### Schedule Evaluator

`packages/domain/src/scheduleEvaluator.ts`

```ts
export const shouldCreateChoreToday = (rule: ChoreRule, today: Date): boolean
```

Logic:

- `one_off`: return true iff `today === rule.schedule.date` and no chore yet exists (caller checks existence).
- `recurring`:
  - Check `today >= rule.schedule.startDate`.
  - Check `!rule.schedule.endDate || today <= rule.schedule.endDate`.
  - Check whether today falls on the frequency:
    - `every_n_days`: `(today - startDate) % n === 0`
    - `every_n_weeks`: `(today - startDate) % (n * 7) === 0`
    - `every_n_months_on_nth_day`: month-aware; check month offset and day of month match.

Edge cases to test:

- Frequency = 1 day (daily).
- End date is today (inclusive).
- End date was yesterday (exclusive).
- Monthly chore on the 31st in a 28-day month.
- Chore start date in the future.

---

### Assignment Calculator

`packages/domain/src/assignmentCalculator.ts`

```ts
export const calculateAssignee = (
  rule: ChoreRule,
  assignees: ChoreRuleAssignee[],
  recentAssignments: ChoreAssignment[],
): string | null   // returns userId or null for free-for-all
```

Logic per assignee rule type:

**static**: return `rule.staticAssigneeId`.

**free_for_all**: return `null`.

**round_robin**:

1. Compute total weight = sum of all assignees' weights.
2. Compute each assignee's target fraction = `weight / totalWeight`.
3. Count how many of the `recentAssignments` went to each assignee. This gives observed fractions.
4. The next assignee is the one whose `targetFraction - observedFraction` is largest (most owed).
5. Break ties by selecting randomly among tied candidates (use a seeded random from the assignment timestamp for reproducibility in tests).

Notes:

- `recentAssignments` should cover at least `1 / minWeight` assignments for statistical accuracy. The caller (job runner) fetches e.g. the last 100 assignments.
- If no recent assignments exist, start from position 0 (first in the sorted assignee list).
- If a user is deleted from the assignee list but appears in `recentAssignments`, ignore them in the deficit calculation.

---

### Expiration Evaluator

`packages/domain/src/expirationEvaluator.ts`

```ts
export const shouldExpireChore = (chore: Chore, today: Date): boolean
```

Returns true iff `chore.status === 'incomplete'` and `today > chore.dueDate + 7 days`.

---

### Assignment Job Runner

`packages/domain/src/assignmentJobRunner.ts`

```ts
export type AssignmentJobConfig = {
  sendNotifications: boolean;
  websiteUrl: string;
};

export const runAssignmentJob = async (
  repos: { chores: ChoreRepository; choreRules: ChoreRuleRepository; users: UserRepository },
  sink: NotificationSink,
  config: AssignmentJobConfig,
  today: Date,
): Promise<AssignmentJobResult>
```

Algorithm:

1. Fetch all incomplete chores. For each, call `shouldExpireChore`. If true, call `chores.updateStatus(id, 'expired')`.
2. Fetch all active chore rules. For each rule:
   a. Call `shouldCreateChoreToday(rule, today)`.
   b. If false, skip.
   c. Call `chores.findExistingForRuleAndDate(rule.id, today)`. If exists, skip (idempotent).
   d. Fetch assignees and recent assignments. Call `calculateAssignee`.
   e. Call `chores.createChore(...)`.
3. If `config.sendNotifications`:
   a. Fetch all users with text opt-in.
   b. For each user, fetch their incomplete chores + all unassigned chores.
   c. Call `sink.sendDailySummary(user, assigned, unassigned, websiteUrl)`.
4. Return a summary: `{ expiredCount, createdCount, notificationsSent }`.

---

### In-Memory Test Implementations

`packages/domain/src/testing/inMemoryChoreRuleRepository.ts`
`packages/domain/src/testing/inMemoryChoreRepository.ts`
`packages/domain/src/testing/inMemoryUserRepository.ts`
`packages/domain/src/testing/consoleNotificationSink.ts`

Each is a simple array-backed implementation of the relevant interface, seeded from constructor arguments.

---

### Tests

`packages/domain/src/__tests__/scheduleEvaluator.test.ts` — 15+ test cases covering all schedule types and edge cases.

`packages/domain/src/__tests__/assignmentCalculator.test.ts` — tests for static, free-for-all, round-robin (equal weights, unequal weights, tiebreaking, missing previous assignments, deleted assignee in history).

`packages/domain/src/__tests__/expirationEvaluator.test.ts` — boundary conditions (exactly 7 days, 8 days, completed chore not expired).

`packages/domain/src/__tests__/assignmentJobRunner.test.ts` — integration-style tests using in-memory repos; verify correct chores created, expired, notifications sent.

---

## Test Checklist

- [ ] `pnpm --filter @chore-wheel/domain test` → 0 failures, 100% of public functions covered.
- [ ] Round-robin produces correct distribution over 100 simulated runs with 3:1 weights.
- [ ] Job runner is idempotent — running twice on the same day doesn't duplicate chores.
- [ ] Type-check passes with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.

---

## Commit Message

`feat(domain): add chore scheduling, assignment, expiration logic, and job runner`
