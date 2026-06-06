# Phase 09 — AWS Infrastructure

**Goal:** CDK stack deployed to AWS. SNS configured for direct-to-phone SMS. IAM credentials issued for the Next.js app. All resources documented and reproducible.

**Prerequisites:** Phase 01 complete (monorepo). AWS CLI configured with deploy credentials. CDK bootstrapped.

**Note:** This phase can run in parallel with Phases 05–07. The SNS notification sink in earlier phases uses the `ConsoleNotificationSink` stub until this phase is deployed.

---

## Package: `infrastructure/`

### Setup

```
cd infrastructure
pnpm add aws-cdk-lib constructs
pnpm add -D aws-cdk @types/node typescript ts-node
```

`infrastructure/package.json` scripts:

- `"synth": "cdk synth"`
- `"deploy": "cdk deploy --require-approval never"`
- `"diff": "cdk diff"`
- `"destroy": "cdk destroy"`

`infrastructure/cdk.json`:

```json
{
  "app": "npx ts-node src/app.ts",
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true
  }
}
```

### CDK App

`infrastructure/src/app.ts`:

```ts
const app = new cdk.App();
new ChoreWheelStack(app, 'ChoreWheelStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
```

### Stack: `ChoreWheelStack`

`infrastructure/src/stacks/ChoreWheelStack.ts`

Constructs:

**1. SNS SMS topic** (for future bulk messaging; v1 uses direct-to-phone):

```ts
const smsTopic = new sns.Topic(this, 'SmsTopic', {
  topicName: 'chore-wheel-sms',
  displayName: 'Chore Wheel SMS',
});
```

**2. IAM user for the Next.js app**:

```ts
const appUser = new iam.User(this, 'AppUser', {
  userName: 'chore-wheel-app',
});

appUser.addToPolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['sns:Publish'],
    resources: ['*'], // needed for direct-to-phone publish; not a topic ARN
  }),
);

const accessKey = new iam.CfnAccessKey(this, 'AppUserAccessKey', {
  userName: appUser.userName,
});
```

**3. CloudFormation outputs**:

```ts
new cdk.CfnOutput(this, 'SmsTopicArn', { value: smsTopic.topicArn });
new cdk.CfnOutput(this, 'AppUserAccessKeyId', { value: accessKey.ref });
new cdk.CfnOutput(this, 'AppUserSecretAccessKey', { value: accessKey.attrSecretAccessKey });
```

⚠️ The secret access key is in CloudFormation outputs in plaintext. After first deploy, copy the values to Vercel env vars, then consider rotating the key and storing it in AWS Secrets Manager for tighter security. Log this as an open question.

### SNS Spending Limit

Set an SMS spending limit to avoid unexpected charges:

```ts
new sns.CfnSMSPreferences(this, 'SmsPreferences', {
  monthlySpendLimit: 10, // USD; adjust as needed
  defaultSenderid: 'CHOREWHEEL',
  defaultSmsType: 'Transactional',
});
```

---

## Deployment Steps

1. `cd infrastructure && pnpm install`
2. `pnpm cdk bootstrap aws://<account-id>/<region>` (one-time)
3. `pnpm cdk synth` — verify template looks correct.
4. `pnpm cdk deploy` — deploys stack; outputs access key, secret, topic ARN.
5. Copy outputs to `apps/web/.env.local` and to Vercel env vars.

---

## Tests

`infrastructure/src/__tests__/ChoreWheelStack.test.ts`:

- Uses CDK `Assertions` library.
- Asserts: SNS topic exists, IAM user exists, policy allows `sns:Publish`.
- Does not deploy anything — purely static template analysis.

```ts
import { Template } from 'aws-cdk-lib/assertions';
const app = new cdk.App();
const stack = new ChoreWheelStack(app, 'TestStack');
const template = Template.fromStack(stack);
template.hasResourceProperties('AWS::SNS::Topic', { TopicName: 'chore-wheel-sms' });
template.hasResourceProperties('AWS::IAM::User', { UserName: 'chore-wheel-app' });
```

---

## Test Checklist

- [ ] `pnpm cdk synth` produces a valid CloudFormation template.
- [ ] CDK assertion tests pass.
- [ ] After deploy: `aws sns publish --phone-number <your-number> --message "test"` sends an SMS.
- [ ] IAM credentials in `.env.local` allow the Next.js app to publish SMS.
- [ ] Monthly spend limit is set.

---

## Security Notes

- The CDK-created IAM user is scoped to `sns:Publish` only.
- Access key appears in CloudFormation outputs. Rotate it after deploy using the AWS Console → IAM → Security credentials.
- For production hardening: store the secret in AWS Secrets Manager and fetch it at runtime instead of keeping it in an env var. Log this in `open-questions.md`.

---

## Commit Message

`feat(infrastructure): add CDK stack with SNS topic, IAM app user, and spending limit`
