# @chore-wheel/infrastructure

AWS CDK app. Deploys the SNS topic and IAM user for the Next.js app.

## Files

| Path                            | Purpose                                           |
| ------------------------------- | ------------------------------------------------- |
| `src/index.ts`                  | Stub — CDK stack implemented in Phase 09          |
| `src/app.ts`                    | CDK app entry point (Phase 09)                    |
| `src/stacks/ChoreWheelStack.ts` | Main CloudFormation stack (Phase 09)              |
| `cdk.json`                      | CDK app config (Phase 09)                         |
| `cdk.out/`                      | Synthesized CloudFormation templates (gitignored) |

## Deployment

See `.planning/phases/09-aws-infrastructure.md` for full instructions.
AWS CLI must be invoked via full path on this machine:
`& "C:\Program Files\Amazon\AWSCLIV2\aws.exe"` in PowerShell.
