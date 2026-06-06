# Phase 08 — Frontend Features

**Goal:** All feature pages complete, working end-to-end, and e2e-tested. Profile management, chore dashboard, chore rules CRUD, and admin job trigger all functional.

**Prerequisites:** Phases 05–07 complete.

---

## Pages Overview

All feature pages live under `apps/web/src/app/(app)/` (authenticated layout).

---

## Dashboard: `/` (`page.tsx`)

Four sections, each fetched in parallel via React Server Component:

```
┌── YOUR CHORES ─────────────────────┐
│ [ChoreCard] [ChoreCard] ...        │
└────────────────────────────────────┘
┌── UNASSIGNED ──────────────────────┐
│ [ChoreCard] ...                    │
└────────────────────────────────────┘
┌── HOUSEMATES' CHORES ──────────────┐
│ [ChoreCard] ...                    │
└────────────────────────────────────┘
┌── RECENTLY EXPIRED (< 1 month) ───┐
│ [ChoreCard] ...                   │
└───────────────────────────────────┘
```

Empty state for each section: `-- none --` in muted terminal text.

Data fetching: server-side `fetch()` calls to `/api/chores?section=mine`, etc. (RSC data fetch).

### `ChoreCard` (`components/features/ChoreCard.tsx`)

Props: `chore: ChoreWithAssignee`, `currentUserId: string`, `onAction?: () => void`.

Displays: title, due date, assignee (or unassigned label), status badge, action buttons.

Consumes from `useTheme().primitives`: `Box`, `Button`, `Badge`, `UserChip`.

Action buttons (context-sensitive):

- Assigned to me + incomplete: complete, cancel, reassign buttons
- Unassigned + incomplete: claim, cancel buttons
- Others' chores: reassign button (any user can reassign)
- Expired: read-only display.

The reassign action opens a `ReassignModal`. `ChoreCard` must not contain any ASCII characters, color values, or layout strings directly — those come from the primitives provided by the active theme.

### `ReassignModal` (`components/features/ReassignModal.tsx`)

Fetches `GET /api/users`, shows a list of `UserChip` primitives plus an unassign option.
Calls `PATCH /api/chores/[id]/reassign` on selection.
Consumes from `useTheme().primitives`: `Modal`, `UserChip`, `Button`, `Spinner`.

### New One-Off Chore (`CreateChoreModal`)

Triggered by a new-chore button on the dashboard.
Form: title, due date, optional assignee (dropdown of users).
Calls `POST /api/chores`.
Consumes from `useTheme().primitives`: `Modal`, `Input`, `Button`, `Label`.

---

## Chore Rules: `/rules`

### List page (`apps/web/src/app/(app)/rules/page.tsx`)

```
┌── CHORE RULES ─────────────────────────────────────────────┐
│ [ACTIVE]  Take out trash    Every Mon  → Round Robin       │
│ [ACTIVE]  Buy groceries     Every 2wks → Static: Alice     │
│ [INACTIVE] Mow lawn         One-off    → Free for all      │
│                                                [+ NEW RULE] │
└────────────────────────────────────────────────────────────┘
```

Each rule row: title, schedule summary, assignee rule summary, status badge, `[EDIT]` `[DELETE]` buttons.

### `ChoreRuleRow` (`components/features/ChoreRuleRow.tsx`)

Props: `rule: ChoreRuleWithAssignees`, `onEdit`, `onDelete`.
Consumes from `useTheme().primitives`: `Badge`, `Button`.

### Create/Edit rule: `/rules/new` and `/rules/[id]/edit`

Shared form component: `ChoreRuleForm` (`components/features/ChoreRuleForm.tsx`).
All form controls must use primitives from `useTheme().primitives`; no direct imports from any theme folder.

The form has three sections:

**1. Basics**

- Title (`Input` primitive)
- Status (`Toggle` primitive: active/inactive)

**2. Schedule Builder** (`components/features/ScheduleBuilder.tsx`)

- Mode selector (`Tabs` primitive): One-off / Recurring
- One-off: date picker (`Input` with `type="date"`).
- Recurring:
  - Frequency type (`Tabs` or group of `Button` primitives): Every N days / Every N weeks / Monthly on Nth day
  - N (`Input`)
  - Start date (`Input`)
  - End date, optional (`Input`)

**3. Assignee Rule Builder** (`components/features/AssigneeRuleBuilder.tsx`)

- Mode selector (`Tabs` primitive): Static / Round Robin / Free-for-all
- Static: user select (`UserChip` list or `Input`-backed dropdown).
- Round Robin: ordered list of `UserChip` components with weight inputs (`Input`). Weights default to equal; must sum to ≤ 100 (shown as percentages). Add/remove users.
- Free-for-all: no further input.

Form submit: `POST /api/chore-rules` (new) or `PATCH /api/chore-rules/[id]` (edit).

Delete: confirm dialog → `DELETE /api/chore-rules/[id]` → redirect to `/rules`.

---

## Profile: `/profile`

### `ProfilePage` (`apps/web/src/app/(app)/profile/page.tsx`)

```
┌── PROFILE ─────────────────────────────────────┐
│ Name: Alice Smith             [EDIT]            │
│ Email: alice@example.com      (read-only)       │
│ Phone: +1 555-555-5555        (read-only)       │
├── NOTIFICATIONS ───────────────────────────────┤
│ SMS alerts:   [ON ]                            │
│ Email alerts: [OFF]                            │
├── PASSKEYS ────────────────────────────────────┤
│ 🔑 MacBook Touch ID   Added 2025-01-01         │
│ 🔑 iPhone Face ID     Added 2025-06-01  [DEL]  │
│                              [+ ADD PASSKEY]   │
├── DANGER ZONE ─────────────────────────────────┤
│                          [DELETE ACCOUNT]      │
└────────────────────────────────────────────────┘
```

#### Name edit

Inline edit: click `[EDIT]` → input appears. Save → `PATCH /api/users/me`.

#### Notification toggles

`Toggle` primitives (the terminal theme renders these as `[ON ] / [OFF]`; another theme might render them as a pill switch) → `PATCH /api/users/me { optInTexts, optInEmails }`.

#### Passkeys

List: `GET /api/users/me` includes passkey metadata (id, deviceType, createdAt). Note: `credentialId` and `publicKey` are never returned to the client.

Add passkey: calls `POST /api/auth/registration/start` (for an already-authenticated user — generates new credential options), then `startRegistration()`, then `POST /api/auth/registration/finish`. New passkey stored.

Delete passkey: `DELETE /api/auth/passkeys/[id]`. Must have at least one remaining passkey — show error if deleting the last one.

#### Delete account

Confirm dialog (type "DELETE" to confirm). Calls `DELETE /api/users/me`. Redirects to `/login`.

---

## Admin: `/admin/run-job`

```
┌── RUN ASSIGNMENT JOB ──────────────────────────┐
│ This will:                                     │
│  • Expire overdue chores                       │
│  • Create new chores from active rules         │
│  • Send SMS/email notifications (optional)     │
│                                                │
│ Send notifications: [YES]                      │
│                                                │
│                          [► RUN JOB]           │
└────────────────────────────────────────────────┘
Last run result:
  Created: 3 chores
  Expired: 1 chore
  Notified: 4 users
```

Calls `POST /api/jobs/run?disableMessages=<bool>`.
Shows result summary after completion.

---

## Feature Components Summary

All components listed here are **theme-agnostic**: they receive data as props and delegate every visual decision to primitives obtained from `useTheme().primitives`. None of them import from `themes/terminal/` or any other theme folder, and none contain hard-coded color values, ASCII characters, or font references.

| Component           | File                               | Primitives consumed                      | Purpose                             |
| ------------------- | ---------------------------------- | ---------------------------------------- | ----------------------------------- |
| ChoreCard           | `features/ChoreCard.tsx`           | `Box`, `Button`, `Badge`, `UserChip`     | Display one chore with actions      |
| ReassignModal       | `features/ReassignModal.tsx`       | `Modal`, `UserChip`, `Button`, `Spinner` | Pick a new assignee                 |
| CreateChoreModal    | `features/CreateChoreModal.tsx`    | `Modal`, `Input`, `Button`, `Label`      | Create a one-off chore              |
| ChoreRuleRow        | `features/ChoreRuleRow.tsx`        | `Badge`, `Button`                        | One row in the rules list           |
| ChoreRuleForm       | `features/ChoreRuleForm.tsx`       | `Input`, `Label`, `Button`, `Toggle`     | Create/edit a chore rule            |
| ScheduleBuilder     | `features/ScheduleBuilder.tsx`     | `Tabs`, `Input`, `Label`                 | Sub-form for schedule config        |
| AssigneeRuleBuilder | `features/AssigneeRuleBuilder.tsx` | `Tabs`, `UserChip`, `Input`, `Button`    | Sub-form for assignee rule          |
| NavigationBar       | `features/NavigationBar.tsx`       | `Button`                                 | App nav bar (from Phase 07)         |
| ThemeSwitcher       | `features/ThemeSwitcher.tsx`       | `Button` or `Tabs`                       | Theme selection control (see below) |

---

## Theme Switcher

### Component: `ThemeSwitcher` (`components/features/ThemeSwitcher.tsx`)

A small UI control that lets the user pick the active theme at runtime.

**Behavior:**

- Reads the current `themeName` and `setTheme` from `useTheme()`.
- Renders the list of available theme names from `themes/index.ts` (the registry).
- On selection, calls `setTheme(name)`, which persists to `localStorage` and re-renders the entire app with the new primitives.
- No page reload is required.

**Placement:** Rendered in the profile page (`/profile`) under a "Appearance" section, and optionally as a compact control in the navigation bar.

**Profile page "Appearance" section example layout (terminal theme):**

```
├── APPEARANCE ──────────────────────────────────────┤
│ Theme:  [TERMINAL]  [ modern ]                     │
└────────────────────────────────────────────────────┘
```

The active theme name is highlighted using the `Button` `primary` variant; inactive themes use `ghost`.

**Implementation notes:**

- `ThemeSwitcher` uses `Button` from `useTheme().primitives` for the selectors. Because it uses primitives from the currently active theme, the switcher itself will re-render in the new theme's style immediately after switching — which provides instant visual feedback.
- The theme registry (`themes/index.ts`) is the single source of truth for which themes exist. `ThemeSwitcher` reads from the registry's key list and derives display labels from the theme names (e.g., `"terminal"` → `"Terminal"`, `"modern"` → `"Modern"`).
- If a theme module fails to load (dynamic import error), `ThemeProvider` falls back to `"terminal"` and logs a console warning. `ThemeSwitcher` should show an error toast via `addToast`.

---

## Hooks

`useChores(section)` — fetches chores for the given section, returns `{ chores, isLoading, mutate }`.
`useChoreRules()` — fetches chore rules.
`useUsers()` — fetches user list for reassign dropdowns.

---

## Tests

### Component tests

All component tests wrap the component under test in `ThemeProvider` with the terminal theme. This validates that the component correctly consumes primitives from context.

- `ChoreCard` — renders all action button combinations based on props; no ASCII characters appear in the component's own JSX (they come from primitives).
- `ScheduleBuilder` — shows correct sub-inputs for each frequency type.
- `AssigneeRuleBuilder` — round-robin weight sum updates correctly.
- `ProfilePage` — toggle updates, add passkey flow, delete account confirmation.
- `ThemeSwitcher` — selecting a theme calls `setTheme`; active theme is visually distinguished.

### E2E tests (`apps/web/e2e/`)

- `dashboard.spec.ts` — complete, cancel, reassign a chore.
- `rules.spec.ts` — create, edit, delete a chore rule.
- `profile.spec.ts` — update name, toggle notifications, delete account.
- `admin.spec.ts` — trigger job, verify result summary shown.

---

## Test Checklist

- [ ] All four dashboard sections render correctly with real data.
- [ ] Creating a one-off chore appears immediately on the dashboard.
- [ ] Creating a chore rule then triggering the job creates a new chore.
- [ ] Deleting an account unassigns chores and redirects to login.
- [ ] ThemeSwitcher selects a theme, persists to localStorage, and the page re-renders without a reload.
- [ ] No feature component file contains an import from `themes/terminal/` or any other theme folder (enforced by a lint rule or grep check in CI).
- [ ] All e2e tests pass on Playwright (desktop and mobile viewports).

---

## Commit Message

`feat(ui): add dashboard, chore rules, profile, and admin pages`
