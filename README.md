# Chore Wheel

A shared household chore management app with a retro terminal UI.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│   Next.js App (Vercel)  ←──→  WebAuthn Passkey Auth     │
└────────────────┬────────────────────────────────────────┘
                 │ API Routes (App Router)
     ┌───────────┼────────────────┐
     │           │                │
     ▼           ▼                ▼
  Neon        iron-session     AWS SNS
  Postgres    (cookie auth)    (SMS)
  (Drizzle)
     │
     ▼
┌────────────────────┐
│  Vercel Cron Job   │  ──→  runs daily at 8 AM UTC
│  /api/jobs/assign  │       expires old chores, creates new,
│       -chores      │       sends SMS summaries
└────────────────────┘
```

## Packages

| Package             | Description                                                                           |
| ------------------- | ------------------------------------------------------------------------------------- |
| `apps/web`          | Next.js 14 app (UI + API routes + cron handler)                                       |
| `packages/domain`   | Pure business logic (scheduling, assignment, expiration) with abstract I/O interfaces |
| `packages/database` | Drizzle ORM schema, migrations, Postgres repository implementations                   |
| `infrastructure`    | AWS CDK stack (SNS topic + IAM credentials for app)                                   |

## Local Development

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local
# Fill in: DATABASE_URL, SESSION_SECRET, WEBAUTHN_*, AWS_*, CRON_SECRET

# Apply DB migrations
pnpm --filter @chore-wheel/database db:migrate

# Start dev server
pnpm dev

# Run Storybook
pnpm storybook

# Run tests
pnpm test

# Deploy AWS infrastructure (one-time)
cd infrastructure && pnpm cdk deploy
```

## Implementation Plan

See [`.planning/high-level-plan.md`](.planning/high-level-plan.md) for the full phase sequence.
See [`.planning/action-checklist.md`](.planning/action-checklist.md) for required setup steps.

## Agent Rules

See [`CLAUDE.md`](CLAUDE.md) for the mandatory development workflow (red-green TDD, code review before commit, self-updating docs).
