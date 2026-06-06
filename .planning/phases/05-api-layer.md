# Phase 05 — API Layer

**Goal:** All CRUD and action API routes working with real Postgres. Postgres-backed implementations of all domain interfaces. Integration-tested.

**Prerequisites:** Phases 01–04 complete.

---

## Postgres Repository Implementations

In `packages/database/src/repositories/`:

### `PostgresUserRepository`

Implements `UserRepository` from `@chore-wheel/domain`.

- `findAll()` — `SELECT * FROM users ORDER BY name`.
- `findById(id)` — by PK.
- `findUsersWithTextOptIn()` — `WHERE opt_in_texts = true`.
- `findUsersWithEmailOptIn()` — `WHERE opt_in_emails = true`.
- Additional write methods needed by the API (not on the domain interface):
  - `updateProfile(id, { name, optInTexts, optInEmails })`
  - `deleteUser(id)` — cascades via FK.

### `PostgresChoreRuleRepository`

Implements `ChoreRuleRepository`.

- `findAllActive()` — `WHERE status = 'active'`.
- `findById(id)`.
- `findAssigneesForRule(ruleId)` — joined with users for name.
- `findRecentAssignmentsForRule(ruleId, count)` — last N chores for this rule where assigneeId is not null, ordered by dueDate desc.
- Additional write methods:
  - `createChoreRule(input)`
  - `updateChoreRule(id, input)`
  - `deleteChoreRule(id)` — sets status = 'inactive' (soft delete); optionally hard delete.
  - `setAssignees(ruleId, assignees: Array<{ userId, weight, position }>)` — replace all assignees in a transaction.

### `PostgresChoreRepository`

Implements `ChoreRepository`.

- `findExistingForRuleAndDate(ruleId, dueDate)`.
- `findOverdueIncomplete(thresholdDate)` — `WHERE status = 'incomplete' AND due_date < thresholdDate`.
- `createChore(input)`.
- `updateStatus(id, status)`.
- `findAllIncompleteAndExpired()` — for dashboard.
- Additional write/read methods:
  - `findByAssignee(userId)` — all incomplete chores for a user.
  - `findUnassigned()` — `WHERE assignee_id IS NULL AND status = 'incomplete'`.
  - `findRecentlyExpired(since: Date)` — `WHERE status = 'expired' AND updated_at > since`.
  - `reassign(id, newAssigneeId: string | null)`.

---

## Next.js API Routes

All routes are in `apps/web/src/app/api/`.

### Users

`GET /api/users/me` — returns current user (from session).
`PATCH /api/users/me` — update name, opt-in prefs.
`DELETE /api/users/me`:

- Unassigns all outstanding chores (sets `assignee_id = NULL`).
- Removes user from all chore rule assignee lists; rebalances round-robin weights equally among remaining.
- Deletes user record.
- Destroys session.

`GET /api/users` — list all users (for reassign UI).

### Chore Rules

`GET /api/chore-rules` — list all (active) chore rules with assignees.
`POST /api/chore-rules` — create. Body validated with Zod.
`GET /api/chore-rules/[id]` — get one with assignees.
`PATCH /api/chore-rules/[id]` — update title, status, schedule, assignee rule. In a single transaction.
`DELETE /api/chore-rules/[id]` — soft-delete (set status = inactive).

### Chores

`GET /api/chores` — list chores. Query params: `assigneeId`, `status`, `section` (`mine` | `unassigned` | `others` | `recently_expired`).
`POST /api/chores` — create a one-off chore. Body: `{ title, dueDate, assigneeId? }`.
`GET /api/chores/[id]` — get one chore.
`PATCH /api/chores/[id]/complete` — set status = 'complete'.
`PATCH /api/chores/[id]/cancel` — set status = 'canceled'.
`PATCH /api/chores/[id]/reassign` — body: `{ assigneeId: string | null }`.

### Jobs

`POST /api/jobs/run`:

- Requires valid session (any authenticated user can trigger manually).
- Query param: `?disableMessages=true` to skip notifications.
- Instantiates `PostgresChoreRepository`, `PostgresChoreRuleRepository`, `PostgresUserRepository`.
- Instantiates notification sink (real SNS or stub based on `disableMessages`).
- Calls `runAssignmentJob(...)`.
- Returns `AssignmentJobResult`.

`GET /api/jobs/assign-chores` (Vercel cron):

- Authenticated by `Authorization: Bearer <CRON_SECRET>` header (Vercel injects this).
- Runs the full job with notifications enabled.
- Returns 200 on success.

---

## Input Validation

All route bodies are validated with Zod schemas. On validation failure, return 422 with a structured error:

```json
{ "error": "Validation failed", "issues": [{ "path": ["title"], "message": "Required" }] }
```

---

## Error Handling

Route handlers return typed error responses:

- 400 — bad input (non-Zod validation, e.g. business rule violation)
- 401 — not authenticated
- 403 — authenticated but not authorized (e.g. modifying another user's profile)
- 404 — resource not found
- 409 — conflict (e.g. duplicate email)
- 422 — schema validation failed
- 500 — internal error (logged, generic message returned)

No raw error objects are ever serialized into responses.

---

## Tests

`apps/web/src/__tests__/api/` — integration tests using `supertest` or Next.js `createRouteHandlerClient` test helper.

Each test:

- Spins up a test transaction that is rolled back after the test.
- Uses real Postgres (test DB).
- Mocks the session to simulate an authenticated user.

Test cases:

- All happy paths.
- 401 on unauthenticated access.
- 404 on missing resource.
- 422 on invalid input.
- `DELETE /api/users/me` — confirms chores unassigned, rule assignees removed, user deleted.
- `POST /api/jobs/run?disableMessages=true` — confirms chores created/expired correctly.

---

## Test Checklist

- [ ] All API routes return correct status codes for happy paths and error cases.
- [ ] Deleting a user correctly cleans up all associated data.
- [ ] Round-robin weights are correctly rebalanced after user deletion.
- [ ] Job endpoint is idempotent (run twice, same result).
- [ ] Cron endpoint returns 401 without correct `CRON_SECRET`.

---

## Commit Message

`feat(api): add all CRUD and action routes with Postgres repositories`
