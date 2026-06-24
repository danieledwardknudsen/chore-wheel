# Chore Wheel — Agent Instructions

## Project Overview

A shared household chore management app. Users sign up with passkeys, view/manage chores, and receive daily SMS/email reminders via a scheduled batch job.

**Stack:** Next.js (Vercel) · Neon Postgres (Drizzle ORM) · Twilio (SMS) · WebAuthn passkeys · pnpm monorepo · Turborepo

See `README.md` for the full component diagram and system description. See `.planning/` for implementation phases and action checklist.

---

## Repository Layout

```
chore-wheel/
├── apps/
│   └── web/               # Next.js app (App Router)
├── packages/
│   ├── database/          # Drizzle schema, migrations, repository interfaces + implementations
│   └── domain/            # Pure business logic (no I/O dependencies)
├── infrastructure/        # AWS CDK app
├── .claude/
│   └── skills/            # Project-specific skill overrides
├── .planning/             # Implementation phase plans (read before starting a phase)
├── CLAUDE.md              # ← you are here
└── README.md              # Concise system description + diagrams (keep updated)
```

Each directory contains a `README.md` that lists every file in that directory and its purpose.

---

## Development Workflow

### 1. Workspace Isolation (mandatory for every task)

Multiple agents may be working in this repo at the same time. To avoid stepping on in-progress work, **never make changes directly on `main`**:

1. **Start a worktree** for the task using the `EnterWorktree` tool (name it after the task, e.g. `EnterWorktree({ name: "fix-eslint-dependency" })`). This creates an isolated checkout at `.claude/worktrees/<name>` on a new `worktree-<name>` branch and switches the session into it.
2. **Do the work** in that worktree — follow the Red-Green Development and Code Review steps below, and commit as you go.
3. **Merge back to `main`** when the task is done and verified: switch back to the repo root, `git merge --no-ff worktree-<name>`, resolve any conflicts, then `git push`.
4. **Clean up the worktree** — use `ExitWorktree({ action: "remove" })` (or `git worktree remove` + `git branch -d worktree-<name>` if you left the session some other way) so stale worktrees don't accumulate under `.claude/worktrees/`.

Skip this for trivial, single-file doc/config edits where the risk of conflicting with another agent is negligible — use judgment.

### 2. Red-Green Development (mandatory for every feature)

1. **Write tests first** — unit tests for domain logic, integration tests for API routes, component tests for UI.
2. **Verify they fail** — run the relevant test suite and confirm new tests are red.
3. **Write the implementation** — make the tests green.
4. **Verify tests pass** — run the full suite; nothing else should break.
5. **Refactor** — clean up naming, remove duplication, improve clarity. Re-verify tests.
6. **Write/update docs** — update the directory README and, if the feature is user-visible, the top-level README.

### 3. Code Review Before Every Commit

After a feature is green and refactored:

1. Run `/code-review ultra` to get an adversarial multi-agent review of the diff.
2. Address all findings (or log them as open questions in `.planning/open-questions.md`).
3. Run `/verify` to confirm the feature still works end-to-end.
4. Commit.

### 4. Self-Updating Documentation

If you discover that a README, skill, or rule is wrong or incomplete, fix it immediately before moving on. Future agents depend on it being accurate.

---

## Coding Standards

### General

- **No abbreviations or acronyms** in identifiers — be verbose (`choreAssignmentJobRunner`, not `jobRunner` or `cajr`).
- **No suppressed type errors or disabled lint rules.** If unavoidable, add a comment explaining why and open an item in `.planning/open-questions.md`.
- **No comments that describe _what_ code does.** Only comment _why_ when the reason is non-obvious.
- No dead code, backwards-compat shims, or `TODO` comments — open an issue instead.

### Backend / Packages

- **Abstract interface from implementation.** Every I/O dependency (DB, SMS, email) has an interface in `packages/domain/` and at least two implementations: one production (in `packages/database/` or the relevant infra package) and one in-memory (used in unit tests).
- Business logic lives in `packages/domain/` and imports only the abstract interfaces — never a concrete DB or HTTP client.
- All errors should be typed (`Result<T, E>` or thrown with typed classes); no untyped `catch (e: any)`.

### Frontend

- 1 `.tsx` file = 1 exported component (no nested component definitions).
- Folder structure inside `apps/web/src/`:
  - `app/` — Next.js App Router pages and layouts
  - `components/features/` — business-logic-aware components (ChoreCard, AssigneeSelector…). These never import from a specific theme folder.
  - `context/` — React contexts, including `ThemeContext.tsx`
  - `themes/` — one sub-folder per theme (`terminal/`, etc.) plus `types.ts` (ThemePrimitives interface) and `index.ts` (theme registry)
  - `hooks/` — custom React hooks, including `useTheme()` (re-exported from ThemeContext)
  - `lib/` — utility functions and client-side API helpers
  - `types/` — shared TypeScript types specific to the frontend
- Every component in `components/features/` must have a Storybook story. Stories must wrap their component in a `ThemeProvider` decorator (configured globally in `.storybook/preview.ts`) so they work with any theme.
- There is no `components/ui/` folder. All generic visual primitives live inside the relevant theme folder (`themes/terminal/`, etc.) and are accessed only through `useTheme().primitives`.
- Prefer functional syntax: `const MyComponent = (props: { … }) => { … }`.

### UI / Style — Theming Architecture

The app uses a **theme skin pattern**: feature components never reference visual styles directly. Instead, they consume a fixed set of primitive components obtained from the `useTheme()` hook. Swapping the active theme changes every visual detail — colors, typography, border style, spacing, layout idioms — without touching a single feature component.

#### ThemeProvider and useTheme

`apps/web/src/context/ThemeContext.tsx` exports:

- `ThemeProvider` — wraps the entire app (inside the root layout). Reads the active theme name from `localStorage` (key `chore-wheel-theme`, default `"terminal"`). Imports the matching theme module and pushes its primitive implementations into React context. Exposes a `setTheme(name)` function for runtime switching.
- `useTheme()` — returns `{ primitives: ThemePrimitives, themeName, setTheme }`. Feature components destructure `primitives` to get the renderable components.

#### ThemePrimitives interface

Defined in `apps/web/src/themes/types.ts`. Every theme must implement all of these:

| Primitive  | Props summary                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Box`      | `title?: string`, `children`, `className?`                                                                                |
| `Button`   | `variant: 'primary' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md'`, `disabled?`, `loading?`, `onClick`, `children`, `type` |
| `Input`    | `label`, `name`, `type`, `value`, `onChange`, `error?`, `placeholder?`                                                    |
| `Label`    | `htmlFor`, `children`                                                                                                     |
| `Badge`    | `status: ChoreStatus \| 'active' \| 'inactive'`                                                                           |
| `Modal`    | `isOpen`, `onClose`, `title`, `children`                                                                                  |
| `Spinner`  | `label?`                                                                                                                  |
| `Toast`    | `message`, `type: 'success' \| 'error' \| 'info'`                                                                         |
| `Toggle`   | `checked`, `onChange`, `label`                                                                                            |
| `Tabs`     | `tabs: { key, label }[]`, `activeKey`, `onChange`                                                                         |
| `UserChip` | `user: { id, name }`, `onClick?`                                                                                          |

#### CSS custom properties (design tokens)

Every theme sets these CSS variables on `:root` (or a theme-scoped selector). Tailwind utility classes are written against `var(--color-*)` references via `tailwind.config.ts` `extend.colors` aliases. Themes swap variable values; utility class names stay constant.

Required token names:

```
--color-bg          main page background
--color-surface     card / box background
--color-border      border color
--color-text        primary text
--color-text-muted  secondary / muted text
--color-accent      interactive accent / hover highlight
--color-danger      destructive actions
--font-family-base  body font stack
--radius-box        border-radius for boxes/cards (0px for terminal)
--radius-button     border-radius for buttons
```

#### Terminal theme (default)

Location: `apps/web/src/themes/terminal/`

Token values:

```
--color-bg:          #0a0a0a
--color-surface:     #0a0a0a
--color-border:      #005514
--color-text:        #00ff41
--color-text-muted:  #2ea043
--color-accent:      #00cc33
--color-danger:      #ff3333
--font-family-base:  'Courier New', Courier, monospace
--radius-box:        0px
--radius-button:     0px
```

Primitive implementations use ASCII box-drawing characters (`─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`) for borders, bracket-style badges (`[✓ DONE]`, `[PENDING]`), ASCII spinner (`| / ─ \`), and `[ON ] / [OFF]` toggle text. Emoji are welcome anywhere.

#### Adding a future theme

1. Create `apps/web/src/themes/<name>/index.tsx` exporting a `ThemePrimitives` object.
2. Set the CSS variable tokens in that file (via a `<style>` injection or a CSS file imported by the module).
3. Register the theme name in `apps/web/src/themes/index.ts`.
4. No feature component or page needs to change.

#### Rule for feature components

Feature components (`ChoreCard`, `ChoreRuleForm`, etc.) must:

- Import primitives exclusively via `const { Box, Button, Badge, … } = useTheme().primitives`.
- Never import from `themes/terminal/` or any other theme folder.
- Never use hard-coded color values, `font-mono`, or ASCII characters directly — those belong in the terminal theme primitives.

---

## Testing Strategy

| Layer               | Framework                  | Location                             |
| ------------------- | -------------------------- | ------------------------------------ |
| Domain logic (pure) | Vitest                     | `packages/domain/src/__tests__/`     |
| DB repositories     | Vitest + real Neon test DB | `packages/database/src/__tests__/`   |
| Next.js API routes  | Vitest + supertest         | `apps/web/src/__tests__/api/`        |
| React components    | Vitest + Testing Library   | `apps/web/src/__tests__/components/` |
| End-to-end          | Playwright                 | `apps/web/e2e/`                      |

Run all tests: `pnpm test`
Run a single package: `pnpm --filter @chore-wheel/domain test`

---

## Environment Variables

See `.planning/action-checklist.md` for which variables are needed and where to put them. Never commit `.env*` files (they are gitignored). Use `.env.example` to document required keys.

---

## Shell Tool Notes (Windows)

- All tools (node, pnpm, git, vercel) are on PATH and work normally in both Bash and PowerShell tools.
- **AWS CLI** is installed at `C:\Program Files\Amazon\AWSCLIV2\aws.exe` but is NOT on the PATH within Claude Code's shell tools. If AWS CLI is ever needed (not required for this project), invoke it as:
  - Bash: `/c/Program\ Files/Amazon/AWSCLIV2/aws.exe`
  - PowerShell: `& "C:\Program Files\Amazon\AWSCLIV2\aws.exe"`

---

## Vercel Cron Job

The batch assignment job runs at `apps/web/src/app/api/jobs/assign-chores/route.ts`. It is protected by a `CRON_SECRET` header that Vercel injects automatically. Configure schedule in `vercel.json`.

---

## Open Questions

Unanswered architectural questions or unavoidable lint suppressions go in `.planning/open-questions.md` with a date stamp.
