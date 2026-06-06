# Open Questions

Format: `### [OPEN/RESOLVED] Short title — YYYY-MM-DD`

---

### [OPEN] Email notification provider — 2026-06-06

The spec mentions email opt-in/out but does not specify the email provider. SMS is handled by Twilio. Options for email:

1. **Twilio SendGrid** — consistent with Twilio for SMS; free tier available; good template support.
2. **AWS SES** — more work (domain verification, IAM, CDK resource), but lowest cost at scale.
3. **Skip email in v1** — implement only SMS for now; add email later.

**Needed to close:** Owner decision. See `action-checklist.md` → "Decide on email notifications".

---

### [RESOLVED] SNS sandbox for SMS — 2026-06-06

No longer applicable. SMS notifications are sent via **Twilio**, not AWS SNS. Twilio requires no sandbox exit process — a trial account can SMS verified numbers immediately, and upgrading removes that restriction.

---

### [RESOLVED] Passkey relying-party ID for local development — 2026-06-06

Production domain: **704418-chores.vercel.app** (Vercel project name: `704418-chores`).

Env var values:

- `WEBAUTHN_RP_ID=704418-chores.vercel.app` (prod) / `localhost` (local)
- `WEBAUTHN_ORIGIN=https://704418-chores.vercel.app` (prod) / `http://localhost:3000` (local)
- `WEBAUTHN_RP_NAME=Chore Wheel`
