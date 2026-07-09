# Seeding — rxsoft-lis-backend

## Purpose

Add or modify seed data for LIS reference entities.

## When to invoke

When adding new reference data (statuses, sample types, test categories, etc.).

## Workflow

1. Add data to `src/database/seeds/seed-lis.ts` using the `upsertBy()` helper:
   ```typescript
   await upsertBy(repo, 'code', { code: 'ENTERED', name: 'Entered', ... });
   ```
2. Gate behind `SEED_ON_START=true` env var (default: `false`).
3. Or add to `src/database/seeds/run.ts` for manual `npm run seed` execution.

## Refactoring

Use the existing `upsertBy()` helper pattern for all new seed data. Follow the same `entities/index.ts` exports pattern for clean references.