# Agentic Infrastructure

## CLAUDE.md

A single `CLAUDE.md` at the repo root covers all agent rules. It includes:

- Project overview and directory layout
- The mandatory red-green development workflow
- The code review + commit process
- Coding standards (naming, abstraction, testing)
- UI/style guide
- Environment variable guide
- Pointers to phase plans and open questions

Sub-packages do **not** need their own CLAUDE.md — every agent reads the root file. Sub-package READMEs serve as directory indexes, not rule files.

## Skills Used in This Project

No custom skills need to be created. The following built-in skills cover the workflow defined in Prompt.md:

| Prompt.md Rule                        | Built-in Skill  | How to Invoke                                                       |
| ------------------------------------- | --------------- | ------------------------------------------------------------------- |
| Adversarial code review before commit | `code-review`   | `/code-review ultra` (multi-agent cloud review of the current diff) |
| Verify feature works end-to-end       | `verify`        | `/verify`                                                           |
| Run the app to see changes            | `run`           | `/run`                                                              |
| Deep research on unknown tech         | `deep-research` | `/deep-research <question>`                                         |

## Self-Updating Documentation Protocol

Per Prompt.md §Agent rules 3: any time a README, CLAUDE.md entry, or phase plan is found to be inaccurate or missing, update it immediately before continuing the implementation task. Log the change in a brief git commit message so it's traceable.

## Directory README Convention

Every directory must have a `README.md` with:

1. A one-line description of the directory's purpose.
2. A table: filename → one-line description.
3. Any local conventions or gotchas for that directory.

Keep READMEs concise — they are for agent orientation, not end-user docs.

## Open Questions File

`.planning/open-questions.md` tracks:

- Architectural decisions that are blocked on user input.
- Linter/type suppressions that can't be avoided.
- Third-party library choices that need validation.

Format per entry:

```
### [OPEN/RESOLVED] Short title — YYYY-MM-DD
Description. What's needed to close it.
```

## Monorepo Package Names

| Package             | npm name                      | Purpose                         |
| ------------------- | ----------------------------- | ------------------------------- |
| `apps/web`          | `@chore-wheel/web`            | Next.js app                     |
| `packages/domain`   | `@chore-wheel/domain`         | Pure business logic             |
| `packages/database` | `@chore-wheel/database`       | Drizzle schema + Postgres repos |
| `infrastructure`    | `@chore-wheel/infrastructure` | AWS CDK app                     |
