# Action Checklist — What I Need From You

This file tracks everything an agent cannot do autonomously. Check off each item and provide the requested details. Items are grouped by phase so you can batch-action them.

---

## Before Phase 01 — Repo & Tooling

- [x] **Create a GitHub repository** named `chore-wheel` (or your preferred name).
  - Should be private.
  - Do not initialize with a README — we'll push the existing directory.
  - Provide the remote URL so the agent can `git remote add origin <url>` and push.
    https://github.com/danieledwardknudsen/chore-wheel.git
- [x] **Install tools on your machine** (if not already installed):
  - [ ] Node.js ≥ 20 LTS: `node --version`
  - [ ] pnpm ≥ 9: `npm install -g pnpm`
  - [ ] AWS CLI v2: `aws --version`
  - [ ] Vercel CLI: `npm install -g vercel`
  - [ ] Git: `git --version`

- [x] **Log in to Vercel CLI**: run `vercel login` in your terminal.

- [x] **Log in to AWS CLI**: run `aws configure` with your IAM credentials (see AWS setup below).
      i used aws login for temporary creds

---

## Before Phase 02 — Database Schema

- [ ] **Create a Neon project** at https://neon.tech
  - Create two databases: `chore_wheel_prod` and `chore_wheel_test`.
  - Provide the connection strings:
    - `DATABASE_URL` (prod) — pooled connection string
    - `DATABASE_URL_TEST` (test) — pooled connection string
    - `DATABASE_URL_DIRECT` (prod) — direct (non-pooled) connection string, needed for migrations

- [ ] **Create a `.env.local` file** in `apps/web/` with the values above. (Template will be in `apps/web/.env.example`.)

---

## Before Phase 03 — Authentication

- [ ] **Set WebAuthn config values** in `.env.local`:
  - `WEBAUTHN_RP_NAME` — human-readable app name, e.g. `"Chore Wheel"`
  - `WEBAUTHN_RP_ID` — your domain (e.g. `chore-wheel.vercel.app` or your custom domain)
  - `WEBAUTHN_ORIGIN` — full origin URL, e.g. `https://chore-wheel.vercel.app`
  - For local dev: `WEBAUTHN_RP_ID=localhost`, `WEBAUTHN_ORIGIN=http://localhost:3000`

- [ ] **Set session secret** in `.env.local`:
  - `SESSION_SECRET` — a random 32+ byte hex string. Generate with: `openssl rand -hex 32`

---

## Before Phase 06 — Batch Job (AWS SNS)

- [x] **Create an AWS account** (if you don't have one): https://aws.amazon.com

- [ ] **Create an IAM user for CDK deployment**:
  - Permissions: `AdministratorAccess` (for CDK bootstrap; can scope down after first deploy)
  - Generate access keys and run `aws configure` to store them locally.

- [ ] **Bootstrap the CDK** (one-time per AWS account/region):

  ```
  cd infrastructure
  pnpm cdk bootstrap aws://<account-id>/<region>
  ```

  Use `us-east-1` unless you have a preference. Provide your AWS account ID:
  - Account ID: **544980890229**
  - Preferred region: **us-west-2**

- [ ] **Request SNS sandbox exit** (for sending SMS to unverified numbers):
  - By default, AWS SNS is in sandbox mode and can only SMS pre-verified numbers.
  - Submit a request to exit sandbox: AWS Console → SNS → Text messaging (SMS) → Request to exit sandbox.
  - This takes 1-3 business days. Until approved, add your phone to the sandbox verified list for testing.
  - Alternatively, for the initial build we can stub SMS behind an interface and skip this.

- [ ] **Set SNS credentials** in `.env.local` after CDK deploy:
  - `AWS_REGION` — e.g. `us-east-1`
  - `AWS_ACCESS_KEY_ID` — from the IAM user created by CDK for the app
  - `AWS_SECRET_ACCESS_KEY` — same
  - `SNS_TOPIC_ARN_SMS` — output from CDK deploy

- [ ] **Set cron secret** in `.env.local`:
  - `CRON_SECRET` — random string used by Vercel to authenticate cron requests. Generate with `openssl rand -hex 32`.

---

## Before Phase 07 — Frontend (Vercel Deployment)

- [ ] **Link the project to Vercel**:

  ```
  vercel link
  ```

  Run in the repo root. Select your team/account and choose "Create new project" or link to an existing one.

- [ ] **Push all environment variables to Vercel**:
      After running `vercel env add` for each variable (or use the Vercel dashboard):
  - `DATABASE_URL`
  - `DATABASE_URL_DIRECT`
  - `SESSION_SECRET`
  - `WEBAUTHN_RP_NAME`
  - `WEBAUTHN_RP_ID`
  - `WEBAUTHN_ORIGIN`
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `SNS_TOPIC_ARN_SMS`
  - `CRON_SECRET`

- [ ] **Set a custom domain** (optional but recommended for passkeys):
  - Passkeys are domain-scoped. If you use a custom domain, set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` to match.
  - Configure the domain in the Vercel dashboard and add DNS records with your registrar.

---

## Ongoing

- [ ] **Phone number for SMS testing** — add your number to the SNS sandbox so we can test notifications before exiting sandbox.

- [ ] **Decide on email notifications** — the spec mentions email opt-in/out. Options:
  - [ ] AWS SNS email subscriptions (simple, no formatting)
  - [ ] AWS SES (more control, requires domain verification)
  - [ ] Skip email for v1 and do SMS only
  - Provide your preference so Phase 06 can be scoped correctly.

---

## Summary of Credentials to Provide

| Variable                | Where                 | When                       |
| ----------------------- | --------------------- | -------------------------- |
| GitHub remote URL       | Git config            | Phase 01                   |
| `DATABASE_URL`          | `.env.local`          | Phase 02                   |
| `DATABASE_URL_TEST`     | `.env.local`          | Phase 02                   |
| `DATABASE_URL_DIRECT`   | `.env.local`          | Phase 02                   |
| `WEBAUTHN_RP_NAME`      | `.env.local`          | Phase 03                   |
| `WEBAUTHN_RP_ID`        | `.env.local`          | Phase 03                   |
| `WEBAUTHN_ORIGIN`       | `.env.local`          | Phase 03                   |
| `SESSION_SECRET`        | `.env.local`          | Phase 03                   |
| `AWS_REGION`            | `.env.local`          | Phase 06                   |
| `AWS_ACCESS_KEY_ID`     | `.env.local`          | Phase 06                   |
| `AWS_SECRET_ACCESS_KEY` | `.env.local`          | Phase 06                   |
| `SNS_TOPIC_ARN_SMS`     | `.env.local`          | Phase 06 (post-CDK deploy) |
| `CRON_SECRET`           | `.env.local` + Vercel | Phase 06                   |
| All of the above        | Vercel dashboard      | Phase 07                   |
