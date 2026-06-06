# Open Questions

Format: `### [OPEN/RESOLVED] Short title — YYYY-MM-DD`

---

### [OPEN] Email notification provider — 2026-06-06

The spec mentions email opt-in/out but does not specify the email provider. Options are:

1. **AWS SNS email subscriptions** — dead simple, but users receive a subscription-confirmation email from AWS, and formatting is plain text only.
2. **AWS SES** — more control over formatting, requires domain verification, separate CDK resource.
3. **Skip email in v1** — implement only SMS for now; add email later.

**Needed to close:** Owner decision. See `action-checklist.md` → "Decide on email notifications".

---

### [OPEN] SNS sandbox for SMS — 2026-06-06

AWS SNS is in sandbox mode by default, which restricts SMS to pre-verified numbers only. Exiting sandbox requires an AWS support request (1-3 business days). Until approved:

- Add test phone numbers to the SNS sandbox verified list.
- The SMS notification sink will be behind an abstract interface anyway, so we can use a stub (logging to stdout) in development without blocking frontend work.

**Needed to close:** Owner must submit sandbox-exit request and confirm approval.

---

### [RESOLVED] Passkey relying-party ID for local development — 2026-06-06

Production domain: **704418-chores.vercel.app** (Vercel project name: `704418-chores`).

Env var values:

- `WEBAUTHN_RP_ID=704418-chores.vercel.app` (prod) / `localhost` (local)
- `WEBAUTHN_ORIGIN=https://704418-chores.vercel.app` (prod) / `http://localhost:3000` (local)
- `WEBAUTHN_RP_NAME=Chore Wheel`
