# High-Level Implementation Plan

## Phase Sequence

Phases must be executed in order. Each phase produces working, tested, committed code before the next begins.

```
Phase 01 — Repo & Tooling          (no dependencies)
  └── Phase 02 — Database Schema   (needs 01: monorepo & Drizzle)
        └── Phase 03 — Auth        (needs 02: users & passkeys tables)
              └── Phase 04 — Domain Logic   (needs 02: schema types)
                    └── Phase 05 — API Layer         (needs 02, 03, 04)
                          └── Phase 06 — Batch Job   (needs 04, 05)
                                └── Phase 07 — Frontend Foundation  (needs 03, 05)
                                      └── Phase 08 — Frontend Features (needs 05, 06, 07)
```

Phase 09 (AWS Infrastructure) is **removed** — Twilio is used for SMS, so there is no AWS infrastructure.

## Phase Summaries

### Phase 01 — Repo & Tooling

**Output:** Empty but fully wired monorepo. CI green. Dev server runs. Storybook runs.

- pnpm workspace + Turborepo
- Next.js 14 (App Router, TypeScript strict)
- Vitest (unit + component tests)
- Playwright (e2e)
- Storybook 8
- ESLint + Prettier + Husky + lint-staged
- GitHub Actions CI (lint, type-check, test, build)
- Vercel project linked (manual step, see action-checklist)
- `.env.example` scaffolded

### Phase 02 — Database Schema

**Output:** Drizzle schema with all tables, migrations applied to Neon, typed query helpers.

Tables:

- `users` — id (uuid), name, email (unique), phone (unique), opt_in_texts, opt_in_emails, created_at
- `passkeys` — id, user_id (fk), credential_id (unique), public_key, counter, transports, created_at
- `phone_verifications` — id, phone, code (6-digit), expires_at, verified_at
- `chore_rules` — id, title, status, assignee_rule_type, schedule_type, schedule_config (jsonb), created_at, updated_at
- `chore_rule_assignees` — id, chore_rule_id (fk), user_id (fk), weight (numeric, default 1)
- `chores` — id, title, status, due_date, assignee_id (fk nullable), chore_rule_id (fk nullable), created_at, updated_at

Drizzle relations defined. Zod schemas derived from Drizzle types. Integration tests against real Neon test DB.

### Phase 03 — Authentication

**Output:** Sign-up (with phone verification) and sign-in working end-to-end. Protected routes enforced.

- `@simplewebauthn/server` + `@simplewebauthn/browser` for WebAuthn
- `iron-session` for cookie-based sessions
- Twilio Messages API for phone verification SMS (or a console stub in tests)
- API routes: `/api/auth/register/*`, `/api/auth/login/*`, `/api/auth/verify-phone`
- Middleware protecting all non-auth routes
- Tests: unit for session logic, integration for API routes, e2e for sign-up + sign-in flow

### Phase 04 — Chore Domain Logic

**Output:** Fully tested pure-logic package with no I/O dependencies. All scheduling and assignment math correct.

Interfaces (in `packages/domain/src/interfaces/`):

- `ChoreRuleRepository` — `findAllActive(): ChoreRule[]`, `findById()`, etc.
- `ChoreRepository` — `findDueForExpiry()`, `findByRuleAndDate()`, `create()`, `updateStatus()`
- `UserRepository` — `findAll()`, `findById()`
- `NotificationSink` — `sendAssignmentSummary(user, chores)`

Logic (in `packages/domain/src/`):

- `scheduleEvaluator.ts` — given a ChoreRule and a date, return whether a chore should be created
- `assignmentCalculator.ts` — compute assignee for static/round-robin (with weights)/free-for-all
- `expirationEvaluator.ts` — return whether a chore should be expired (> 7 days overdue)
- `assignmentJobRunner.ts` — orchestrates the full batch job using the abstract interfaces

In-memory implementations in `packages/domain/src/testing/`.
Unit tests for every public function including edge cases (leap years, weight tiebreaks, etc.).

### Phase 05 — API Layer

**Output:** All CRUD + action endpoints working with Postgres, integration-tested.

- Postgres implementations of all domain interfaces (in `packages/database/src/repositories/`)
- Next.js route handlers for:
  - `GET/POST /api/chore-rules`, `GET/PATCH/DELETE /api/chore-rules/[id]`
  - `GET/POST /api/chores`, `GET/PATCH /api/chores/[id]`
  - `PATCH /api/chores/[id]/complete`, `PATCH /api/chores/[id]/cancel`, `PATCH /api/chores/[id]/reassign`
  - `GET/PATCH /api/users/me`, `DELETE /api/users/me`
  - `POST /api/jobs/run` (manual trigger, admin only)
- Input validation with Zod on all routes
- Integration tests using a test DB transaction per test (rolled back after)

### Phase 06 — Batch Job

**Output:** Vercel cron running the full assignment job and sending real SNS notifications.

- `apps/web/src/app/api/jobs/assign-chores/route.ts` — cron handler
- `vercel.json` — cron schedule (`0 8 * * *` = 8 AM UTC daily)
- Twilio notification sink implementation (in `packages/domain/src/notifications/`)
- Wires up `assignmentJobRunner` with real Postgres repos + Twilio sink
- Manual trigger endpoint: `POST /api/jobs/run?disableMessages=true` (protected by auth)
- Integration test: runs job against test DB, asserts chores created + statuses updated

### Phase 07 — Frontend Foundation

**Output:** ThemeProvider and terminal theme implemented. All primitive components Storybooked. Auth pages functional.

- `ThemeContext.tsx` — `ThemeProvider` (localStorage persistence, runtime switching) and `useTheme()` hook
- `themes/types.ts` — `ThemePrimitives` TypeScript interface (the full set of primitive components every theme must implement)
- `themes/index.ts` — theme registry mapping string names to theme modules
- `themes/terminal/` — complete terminal theme: CSS token values + implementations of all primitives (`Box`, `Button`, `Input`, `Label`, `Badge`, `Modal`, `Spinner`, `Toast`, `Toggle`, `Tabs`, `UserChip`)
- Tailwind `tailwind.config.ts` extended with `var(--color-*)` aliases so utility classes reference CSS custom properties
- Sign-up page (name, email, phone → SMS verify → passkey registration)
- Sign-in page (passkey assertion)
- Root layout wraps app in `ThemeProvider`; navigation bar renders using theme primitives
- All terminal-theme primitives have Storybook stories; stories run under a `ThemeProvider` decorator

### Phase 08 — Frontend Features

**Output:** All feature pages complete, working, and e2e-tested.

Pages:

- `/` — Dashboard: logged-in user's chores + unassigned + others + recently expired
- `/chores/[id]` — Chore detail (complete, cancel, reassign, view history)
- `/rules` — List chore rules
- `/rules/new` — Create chore rule (form with schedule + assignee rule builder)
- `/rules/[id]` — Edit/delete chore rule
- `/profile` — Profile management (name, passkeys, notification prefs, delete account)
- `/admin/run-job` — Trigger assignment job (disable messages toggle)

Feature components: `ChoreCard`, `ChoreRuleForm`, `AssigneeRuleBuilder`, `ScheduleBuilder`, `UserChip`

### ~~Phase 09 — AWS Infrastructure~~ (removed)

SMS notifications use Twilio instead of AWS SNS. There is no AWS infrastructure, so no CDK stack is needed. The `infrastructure/` package stub remains in the repo but is empty.

---

## Key Architectural Decisions

| Decision         | Choice                                                                                                                                      | Rationale                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo tool    | pnpm + Turborepo                                                                                                                            | Fast installs, cache-aware builds, first-class workspace support                                                                                                           |
| ORM              | Drizzle                                                                                                                                     | TypeScript-native, no magic, SQL-close, works well with Neon                                                                                                               |
| Auth sessions    | `iron-session`                                                                                                                              | Stateless signed cookie, no DB table needed, simple                                                                                                                        |
| WebAuthn library | `@simplewebauthn`                                                                                                                           | Actively maintained, TypeScript-first, well-documented                                                                                                                     |
| State management | React Server Components + `useOptimistic`                                                                                                   | Minimize client JS; RSC handles most data fetching                                                                                                                         |
| Styling          | Tailwind CSS + CSS custom properties                                                                                                        | Utility-first; token aliases (`var(--color-*)`) let themes swap values without changing class names                                                                        |
| Theming          | Theme skin pattern — `ThemeProvider` pushes a `ThemePrimitives` object into context; feature components consume primitives via `useTheme()` | Feature components are fully theme-agnostic. New themes require only a new theme module; zero changes to any feature component or page. Theme persisted in `localStorage`. |
| Component docs   | Storybook 8                                                                                                                                 | Required by Prompt.md; stories run under a `ThemeProvider` decorator                                                                                                       |
| SMS provider     | Twilio Messages API                                                                                                                         | Simpler onboarding than AWS SNS (no sandbox exit process, no CDK, just account SID + auth token + phone number)                                                            |
| Test runner      | Vitest                                                                                                                                      | Fast, ESM-native, compatible with Next.js App Router                                                                                                                       |
