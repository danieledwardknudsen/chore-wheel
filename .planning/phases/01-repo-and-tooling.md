# Phase 01 — Repo & Tooling

**Goal:** Empty but fully wired monorepo. CI green. Dev server runs. Storybook renders a hello-world story.

**Prerequisites:** Node ≥ 20, pnpm ≥ 9, Git installed.

---

## Steps

### 1.1 — Initialize git and pnpm workspace

```
git init
git commit --allow-empty -m "chore: initial commit"
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'infrastructure'
```

Create root `package.json`:

```json
{
  "name": "chore-wheel",
  "private": true,
  "packageManager": "pnpm@9.x",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "format": "prettier --write ."
  }
}
```

Install Turborepo: `pnpm add -Dw turbo`

Create `turbo.json` with pipelines for `build`, `dev`, `test`, `lint`, `type-check`.

### 1.2 — Create Next.js app

```
pnpm create next-app@latest apps/web \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*" \
  --no-git
```

Set `name` in `apps/web/package.json` to `@chore-wheel/web`.

### 1.3 — TypeScript strict config

Root `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true
  }
}
```

Each package extends this base.

### 1.4 — Package stubs

Create empty packages with `package.json` and `tsconfig.json`:

- `packages/domain` → `@chore-wheel/domain`
- `packages/database` → `@chore-wheel/database`
- `infrastructure` → `@chore-wheel/infrastructure`

Each gets a `src/index.ts` that exports nothing, and a `README.md`.

### 1.5 — ESLint + Prettier

Root `.eslintrc.js` extending `next/core-web-vitals` + `@typescript-eslint/recommended`.
Root `.prettierrc` with sensible defaults (single quotes, trailing commas, 100-char width).
Add `prettier` and ESLint plugins to root devDependencies.

### 1.6 — Husky + lint-staged

```
pnpm add -Dw husky lint-staged
pnpm exec husky init
```

`.husky/pre-commit` runs lint-staged.
`.lintstagedrc.js` runs `eslint --fix` and `prettier --write` on staged `.ts/.tsx` files, then `tsc --noEmit`.

### 1.7 — Vitest setup

In `apps/web`:

```
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

`apps/web/vitest.config.ts` — environment `jsdom`, aliased imports matching tsconfig.

In each package under `packages/`, add Vitest with environment `node`.

Add `test` script to all `package.json` files.

### 1.8 — Playwright setup

```
cd apps/web && pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

`apps/web/playwright.config.ts` — base URL `http://localhost:3000`, screenshot on failure.

### 1.9 — Storybook

```
cd apps/web && pnpm dlx storybook@latest init
```

Add `storybook` and `build-storybook` scripts.
Create a placeholder story: `components/ui/Placeholder.stories.tsx`.

### 1.10 — Tailwind terminal theme

Add to `apps/web/tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      terminal: {
        bg: '#0a0a0a',
        green: '#00ff41',
        accent: '#00cc33',
        muted: '#005514',
        border: '#003300',
      }
    },
    fontFamily: {
      mono: ['var(--font-mono)', 'monospace'],
    }
  }
}
```

Set `<html>` background to `terminal-bg`, text to `terminal-green` in root layout.

### 1.11 — GitHub Actions CI

`.github/workflows/ci.yml` with jobs:

- `lint` — `pnpm lint`
- `type-check` — `pnpm type-check`
- `test` — `pnpm test`
- `build` — `pnpm build`

All jobs run on `ubuntu-latest`, Node 20, pnpm cache.

### 1.12 — Environment file scaffolding

`apps/web/.env.example` — every required env var listed with a comment explaining what it is.
`apps/web/.env.local` — gitignored, to be filled in by the human (see action-checklist).

`.gitignore` — include `.env*`, `node_modules`, `.next`, `dist`, `storybook-static`.

### 1.13 — Root README

`README.md` with:

- Project description
- Component diagram (ASCII)
- Local dev quick-start
- Pointer to `.planning/`

---

## Test Checklist

- [ ] `pnpm install` succeeds with no errors.
- [ ] `pnpm dev` starts the Next.js dev server at `http://localhost:3000`.
- [ ] `pnpm storybook` starts Storybook at `http://localhost:6006`.
- [ ] `pnpm test` runs with 0 failures (only the placeholder tests).
- [ ] `pnpm lint` and `pnpm type-check` exit 0.
- [ ] `pnpm build` produces a working Next.js production build.
- [ ] Pre-commit hook fires on `git commit` and runs lint-staged.

---

## Commit Message

`feat: initialize monorepo with Next.js, Vitest, Playwright, Storybook, and CI`
