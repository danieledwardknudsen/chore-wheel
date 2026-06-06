# Phase 06 — Batch Job & Notifications

**Goal:** Vercel cron running the full assignment job on a daily schedule. Twilio SMS notifications wired. Manual trigger endpoint functional from the UI.

**Prerequisites:** Phases 01–05 complete. Twilio account credentials available (see action-checklist).

---

## Vercel Cron Configuration

`apps/web/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/jobs/assign-chores",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Runs at 8:00 AM UTC daily. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` header.

The route handler validates this header before proceeding:

```ts
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Twilio Notification Sink

`packages/domain/src/notifications/twilioNotificationSink.ts`

Implements `NotificationSink`. Uses the `twilio` npm package.

```ts
import Twilio from 'twilio';

export class TwilioNotificationSink implements NotificationSink {
  private readonly client: Twilio.Twilio;

  constructor(
    accountSid: string,
    authToken: string,
    private readonly fromNumber: string,
  ) {
    this.client = Twilio(accountSid, authToken);
  }

  async sendDailySummary(user, assignedChores, unassignedChores, websiteUrl) {
    const message = formatDailySummaryMessage(user, assignedChores, unassignedChores, websiteUrl);
    await this.client.messages.create({
      body: message,
      from: this.fromNumber,
      to: user.phone,
    });
  }
}
```

`packages/domain/src/notifications/dailySummaryFormatter.ts` — pure function formatting the SMS as plain text.

Message format:

```
🏠 Chore Wheel — [date]
Your chores today:
• [chore title] (due [date])
• [chore title]

Unassigned (anyone can help):
• [chore title]

Manage at: [websiteUrl]
```

---

## Notification Routing

`apps/web/src/lib/notifications/buildNotificationSink.ts` constructs the correct sink:

- Messages enabled: `new TwilioNotificationSink(accountSid, authToken, fromNumber)`
- Messages disabled or in test: `new ConsoleNotificationSink()` (logs to stdout)

---

## Twilio SDK Setup

```
pnpm --filter @chore-wheel/domain add twilio
```

`apps/web/src/lib/notifications/buildNotificationSink.ts`:

```ts
export const buildNotificationSink = (sendMessages: boolean): NotificationSink => {
  if (!sendMessages) return new ConsoleNotificationSink();
  return new TwilioNotificationSink(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
    process.env.TWILIO_PHONE_NUMBER!,
  );
};
```

---

## Phone Verification (also Twilio)

The same Twilio client is used for the sign-up phone verification SMS. The `PhoneVerificationSink` interface (introduced in Phase 03 as a console stub) gets its production implementation here:

`packages/domain/src/notifications/twilioPhoneVerificationSink.ts`:

```ts
export class TwilioPhoneVerificationSink implements PhoneVerificationSink {
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    await this.client.messages.create({
      body: `Your Chore Wheel verification code is: ${code}`,
      from: this.fromNumber,
      to: phone,
    });
  }
}
```

---

## Tests

### Unit tests

`packages/domain/src/__tests__/notifications/dailySummaryFormatter.test.ts`:

- Formats correctly with assigned + unassigned chores.
- Handles zero assigned chores.
- Handles zero unassigned chores.
- Includes the website URL.

### Integration tests

`apps/web/src/__tests__/api/assignChoresJob.test.ts`:

- Uses in-memory repos and `ConsoleNotificationSink`.
- Runs job; verifies chores created and expired chores marked.
- Verifies cron endpoint returns 401 without correct `CRON_SECRET`.
- Verifies cron endpoint returns 200 with correct `CRON_SECRET`.
- Verifies job is idempotent (run twice, same result).

### Manual test (pre-deploy)

- Set real Twilio credentials in `.env.local`.
- Run `POST /api/jobs/run` from the UI.
- Confirm SMS arrives on your phone.

---

## Test Checklist

- [ ] Cron endpoint rejects unauthorized requests.
- [ ] Cron endpoint runs job and returns `{ expiredCount, createdCount, notificationsSent }`.
- [ ] SMS format is readable on mobile.
- [ ] `disableMessages=true` skips Twilio calls entirely.
- [ ] Running the job twice in a day doesn't create duplicate chores.
- [ ] Phone verification SMS sends via Twilio in production mode.

---

## Commit Message

`feat(jobs): add Vercel cron handler and Twilio SMS notification sink`
