# @chore-wheel/web

Next.js 16 app (App Router, TypeScript strict) for Chore Wheel.

## Structure

```
src/
├── app/                        # Next.js App Router pages and layouts
│   ├── layout.tsx              # Root layout: ThemeProvider + NavBar
│   ├── page.tsx                # Home — redirects to /login or /chores
│   ├── login/page.tsx          # Sign-in page (passkey)
│   ├── register/page.tsx       # Multi-step sign-up (phone verify → passkey)
│   ├── chores/                 # Dashboard + chore detail
│   │   ├── page.tsx            # Chore dashboard (server)
│   │   ├── ChoreDashboard.tsx  # Dashboard UI: mine / unassigned / others (client)
│   │   └── [id]/               # Chore detail — complete, cancel, reassign
│   ├── rules/                  # Chore rule management
│   │   ├── page.tsx            # Rules list (server)
│   │   ├── new/page.tsx        # Create rule (server)
│   │   ├── new/NewRuleForm.tsx # New-rule form with ChoreRuleForm (client)
│   │   └── [id]/               # Edit/delete rule
│   ├── profile/                # Profile — name, notification prefs, delete account
│   ├── admin/run-job/          # Manually trigger assignment job
│   └── api/                    # Route handlers
│       ├── auth/               # Registration, login, phone verification, logout
│       ├── chore-rules/        # CRUD for chore rules + assignees
│       ├── chores/             # CRUD + actions (complete, cancel, reassign)
│       ├── users/              # User profile (me) + list
│       └── jobs/               # Manual job trigger + Vercel cron endpoint
├── components/features/        # Business-logic-aware components
│   ├── NavBar.tsx              # Auth-aware navigation bar (server component)
│   ├── ChoreCard.tsx           # Chore card with complete/cancel actions
│   ├── ChoreRuleForm.tsx       # Rule create/edit form (schedule + assignee rule)
│   ├── ScheduleBuilder.tsx     # Schedule picker (one-off or recurring)
│   └── AssigneeRuleBuilder.tsx # Assignee rule picker (free-for-all/round-robin/static)
├── context/
│   └── ThemeContext.tsx        # ThemeProvider + useTheme (client)
├── hooks/
│   └── useTheme.ts             # Re-export of useTheme from ThemeContext
├── themes/
│   ├── types.ts                # ThemePrimitives interface + all prop types
│   ├── index.ts                # Theme registry { terminal: terminalTheme }
│   └── terminal/
│       ├── index.tsx           # Terminal theme: all 11 primitive implementations
│       └── primitives.stories.tsx  # Storybook stories for every primitive
├── types/
│   └── api.ts                  # JSON-serializable response types (ChoreJson, UserJson, etc.)
├── lib/
│   ├── db.ts                   # Drizzle DB client (singleton)
│   └── session.ts              # iron-session helpers
└── middleware.ts               # Auth guard (redirects unauthenticated users)
```

## Theming

Feature components access all UI primitives via `useTheme().primitives`:

```tsx
const { Box, Button, Badge } = useTheme().primitives;
```

Primitives: `Box`, `Button`, `Input`, `Label`, `Badge`, `Modal`, `Spinner`, `Toast`, `Toggle`, `Tabs`, `UserChip`.

Add themes by implementing `ThemePrimitives` in `src/themes/<name>/index.tsx` and registering in `src/themes/index.ts`.

## Dev

```bash
pnpm dev           # Next.js dev server
pnpm storybook     # Storybook
pnpm test          # Vitest integration tests
pnpm type-check    # tsc --noEmit
pnpm lint          # ESLint
```
