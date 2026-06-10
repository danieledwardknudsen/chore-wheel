# End-to-End Tests (Playwright)

Full-stack browser tests covering the core user flows against a **clean test
database** on every run.

## Running

```bash
pnpm --filter web test:e2e          # headless
pnpm --filter web exec playwright test --ui   # interactive UI mode
```

## How isolation works

- **Dedicated server + DB.** Playwright starts its own Next.js dev server on
  port **3100** with `DATABASE_URL` overridden to `DATABASE_URL_TEST` and
  `WEBAUTHN_ORIGIN` set to match the port. It never touches the dev server on
  3000 or the real database. (`playwright.config.ts`)
- **Migrations once per run.** `globalSetup.ts` shells out to
  `scripts/reset-test-db.mjs`, which **drops the `public` and `drizzle` schemas**
  (the latter holds Drizzle's applied-migration log) and re-applies all
  migrations from scratch — guaranteeing the schema matches the migration files
  regardless of prior state.
- **Truncate between tests.** The `cleanDb` / `authedPage` fixtures truncate all
  tables before each test via Neon's HTTP SQL endpoint (`helpers/db.ts`). Tests
  run serially (`workers: 1`) so they share one DB without colliding.

> The reset script and `helpers/db.ts` deliberately avoid importing
> `@neondatabase/serverless` inside Playwright-compiled files — its CJS internals
> break under Playwright's esbuild ESM transform. The reset runs as a plain Node
> child process; the per-test truncate uses bare `fetch`.

## Passkeys

WebAuthn flows use a real virtual authenticator installed over the Chrome
DevTools Protocol (`helpers/webauthn.ts`) — registration and login run the full
ceremony with genuine challenges, no mocking. Chromium only.

The `authedPage` fixture (`fixtures.ts`) registers a fresh user and returns a
logged-in page, so auth-dependent specs start authenticated.

## Files

| File                        | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `fixtures.ts`               | `cleanDb` + `authedPage` custom fixtures             |
| `globalSetup.ts`            | Resets + migrates the test DB once before the suite  |
| `scripts/reset-test-db.mjs` | Drops schemas and re-applies migrations (plain Node) |
| `helpers/db.ts`             | `truncateTables()` via Neon HTTP endpoint            |
| `helpers/webauthn.ts`       | Installs a virtual WebAuthn authenticator via CDP    |
| `public.spec.ts`            | Unauthenticated routes + redirects                   |
| `registration.spec.ts`      | Register flow, validation, duplicate email           |
| `login.spec.ts`             | Passkey login, auth-guard redirect                   |
| `rules.spec.ts`             | Create / edit / delete chore rules                   |
| `chores.spec.ts`            | Job-created chores appear; mark complete             |
| `profile.spec.ts`           | Update name, toggle email opt-in, delete account     |
