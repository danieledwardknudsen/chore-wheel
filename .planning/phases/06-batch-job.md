# Phase 06 — Batch Job & Notifications

**Goal:** Vercel cron running the full assignment job on a daily schedule. SNS SMS notifications wired. Manual trigger endpoint functional from the UI.

**Prerequisites:** Phases 01–05 complete. Phase 09 (AWS CDK) deployed (or SNS stub if CDK not yet deployed).

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

## SNS Notification Sink

`packages/domain/src/notifications/snsNotificationSink.ts`:

Implements `NotificationSink`. Uses `@aws-sdk/client-sns`.

```ts
export class SnsNotificationSink implements NotificationSink {
  constructor(
    private readonly snsClient: SNSClient,
    private readonly topicArn: string,
  ) {}

  async sendDailySummary(user, assignedChores, unassignedChores, websiteUrl) {
    const message = formatDailySummaryMessage(user, assignedChores, unassignedChores, websiteUrl);
    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: message,
        Subject: 'Your chores for today',
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
        },
      }),
    );
  }
}
```

`packages/domain/src/notifications/dailySummaryFormatter.ts` — pure function that formats the notification message as plain text (for SMS).

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

The `POST /api/jobs/run` and `GET /api/jobs/assign-chores` routes construct the notification sink differently:

- With messages enabled + SNS available: `new SnsNotificationSink(snsClient, topicArn)`
- With messages disabled or in test: `new ConsoleNotificationSink()` (logs to stdout)

The sink selection lives in `apps/web/src/lib/notifications/buildNotificationSink.ts`.

---

## Individual Notification vs. Per-User Topics

For simplicity in v1, use **direct SNS Publish** to each user's phone number (not a subscription-based topic). This avoids managing individual subscriptions.

The `sendDailySummary` method publishes to the phone number directly:

```ts
await snsClient.send(
  new PublishCommand({
    PhoneNumber: user.phone, // E.164 format
    Message: message,
  }),
);
```

The CDK stack still creates an SNS topic for future use (e.g., bulk messaging), but the notification sink uses direct-to-phone for v1.

---

## AWS SDK Setup

```
pnpm --filter @chore-wheel/domain add @aws-sdk/client-sns
```

`apps/web/src/lib/notifications/createSnsClient.ts`:

```ts
export const createSnsClient = () =>
  new SNSClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
```

---

## Tests

### Unit tests

`packages/domain/src/__tests__/notifications/dailySummaryFormatter.test.ts`:

- Formats message correctly with assigned + unassigned chores.
- Handles zero assigned chores.
- Handles zero unassigned chores.
- Includes the website URL.

### Integration tests

`apps/web/src/__tests__/api/assignChoresJob.test.ts`:

- Uses in-memory repos and `ConsoleNotificationSink`.
- Runs job; verifies chores created, expired chores marked.
- Verifies cron endpoint returns 401 without CRON_SECRET.
- Verifies cron endpoint returns 200 with correct CRON_SECRET.
- Verifies job is idempotent.

### Manual test (pre-deploy)

- Add your phone to SNS sandbox (verified list).
- Run `POST /api/jobs/run` from the UI.
- Confirm SMS arrives.

---

## Test Checklist

- [ ] Cron endpoint rejects unauthorized requests.
- [ ] Cron endpoint runs job and returns `{ expiredCount, createdCount, notificationsSent }`.
- [ ] SMS format is readable on mobile.
- [ ] `disableMessages=true` skips SNS calls entirely.
- [ ] Running the job twice in a day doesn't create duplicate chores.

---

## Commit Message

`feat(jobs): add Vercel cron handler and SNS SMS notification sink`
