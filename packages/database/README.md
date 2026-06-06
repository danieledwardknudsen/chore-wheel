# @chore-wheel/database

Drizzle ORM schema, migrations, and Postgres repository implementations. Depends on `@chore-wheel/domain` for interface types.

## Files

| Path                | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `src/index.ts`      | Public exports                                           |
| `src/schema/`       | Drizzle table definitions (Phase 02)                     |
| `src/client.ts`     | Neon HTTP client factory (Phase 02)                      |
| `src/validation/`   | Zod schemas for JSONB fields (Phase 02)                  |
| `src/repositories/` | Postgres implementations of domain interfaces (Phase 05) |
| `drizzle.config.ts` | Drizzle Kit config (Phase 02)                            |
| `migrations/`       | Generated SQL migration files                            |
