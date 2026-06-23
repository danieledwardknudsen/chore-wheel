# @chore-wheel/domain

Pure business logic with no I/O dependencies. All data access and notification sending is expressed as abstract interfaces; this package contains zero database or HTTP code.

## Files

| Path                             | Purpose                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                   | Public exports                                                                                                                      |
| `src/interfaces/`                | Abstract interfaces for I/O (Phase 04)                                                                                              |
| `src/types/`                     | Shared domain types (Phase 04)                                                                                                      |
| `src/scheduleEvaluator.ts`       | Schedule evaluation: `shouldCreateChoreToday` (incl. recurring startDate gating + biweekly anchoring) and `hasOneOffSchedulePassed` |
| `src/assignmentCalculator.ts`    | Round-robin + weight assignment (Phase 04)                                                                                          |
| `src/expirationEvaluator.ts`     | Chore expiration logic (Phase 04)                                                                                                   |
| `src/createChoreForRuleIfDue.ts` | Materializes a single rule's chore if due today (shared by job + create-rule API)                                                   |
| `src/assignmentJobRunner.ts`     | Batch job orchestrator: expires overdue chores, creates due chores, deactivates passed one-off rules, sends notifications           |
| `src/notifications/`             | Notification sink implementations (Phase 06)                                                                                        |
| `src/testing/`                   | In-memory I/O stubs for use in tests                                                                                                |
