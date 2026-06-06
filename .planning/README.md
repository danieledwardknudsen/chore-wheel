# Planning Directory

This directory contains all implementation plans and open questions. Read before starting any phase.

## Files

| File                               | Purpose                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| `agentic-infrastructure.md`        | Skills, CLAUDE.md strategy, and agent tooling decisions         |
| `high-level-plan.md`               | Phase overview with dependencies and sequencing rationale       |
| `action-checklist.md`              | Everything the human owner must do before/during implementation |
| `open-questions.md`                | Unresolved questions and unavoidable suppressions               |
| `phases/01-repo-and-tooling.md`    | Monorepo, Next.js, test infra, Storybook setup                  |
| `phases/02-database-schema.md`     | Drizzle schema, migrations, Neon config                         |
| `phases/03-authentication.md`      | WebAuthn passkeys, phone verification, sessions                 |
| `phases/04-chore-domain-logic.md`  | Pure business logic, abstract interfaces, scheduling math       |
| `phases/05-api-layer.md`           | Next.js API routes, Postgres repo implementations               |
| `phases/06-batch-job.md`           | Cron handler, SNS notifications, expiration logic               |
| `phases/07-frontend-foundation.md` | Terminal theme, core UI components, auth pages                  |
| `phases/08-frontend-features.md`   | All feature pages: chores, rules, profile                       |
| `phases/09-aws-infrastructure.md`  | CDK stack, SNS, IAM, deployment                                 |
