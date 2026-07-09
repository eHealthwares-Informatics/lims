# RxSoft LIS Backend Agent

## Overview

NestJS 11 + TypeORM laboratory information system backend. Port 8091. npm.

## DB

PostgreSQL. Supports SQLite for dev. `autoLoadEntities: true`. 32 entities prefixed `lis_`.

## Key commands

- `npm run start:dev` — dev server
- `npm run test:integration` — integration tests (`--runInBand`)
- `npm run seed` — seed database

## Auth

JWT global guard via `APP_GUARD`. `@Public()` for opt-out. `ApiKeyGuard` for interop endpoint. `@CurrentUser()` decorator.

## Architecture

All entities extend `LisBaseEntity` (id, organizationId, locationId, createdAt, updatedAt, deletedAt). All services extend `BaseLisService<T>` which provides paginated `.list()` with soft-delete, tenant scoping, ILIKE search, sorting, and pagination.

## Adding CRUD resources

1. Create entity extending `LisBaseEntity`, export in `entities/index.ts`
2. Create DTO with class-validator
3. Create service extending `BaseLisService<Entity>` — override `searchColumns()`, `sortColumn()`, `relations()`
4. Create controller with list/export/get/create/patch/delete
5. Register in `LisModule`

## List endpoints

Use shared `ListQueryDto` from `src/shared/dto/list-query.dto.ts`. Add sort column allow-lists. CSV export via `GET /export` endpoint convention.

## Key entities (32)

Reference data: LOINC, sample types, rejection reasons, priorities, test categories, test sections, methods, programs, location types, locations, attribute definitions, UOMs, panels.
Core domain: test definitions, reference ranges, patients, orders, order items, results, result signatures, samples, statuses, status history.
QC: QC lots, QC results, QC alerts.
EQA: programs, enrollments, results (schema defined, not wired).

## Refactoring deviations (fix when touching)

### List endpoints (CLOSEST TO STANDARD)
- **No filter DSL** — only `search` param, no `field=TYPE|value` support
- **`sortColumn()` has no column allow-list** — any column accepted (injection risk)
- **Extra `rawQuery: Record<string, string>`** captured in controllers but NOT applied as filters by `BaseLisService`
- `BaseLisService` template method pattern is the most consistent in the repo
- All 20+ controllers use identical pattern: `list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>, @CurrentUser() user)`

### Auth (complete)
- Global `JwtAuthGuard` via `APP_GUARD`
- `@Public()` for health endpoint
- `ApiKeyGuard` for interop endpoint
- Permissions guard exists but not global

### Tests (1 file — needs unit tests)
- Single `lis.integration.spec.ts` tests CRUD for 12+ resources via real PostgreSQL
- **No unit tests** — services use `BaseLisService` which is testable with mocked repos
- `SKIP_AUTH=true` used in tests to bypass JWT guard

### Seeding
- Idempotent via `upsertBy()` helper — **THE TEMPLATE** for simple seeding
- Gated by `SEED_ON_START=false` (default)
- CLI: `npm run seed`
- All data hardcoded (no Google Sheets)

### Schema
- `DB_SYNCHRONIZE=false` (default) — already production-safe
- No migration files — should add them for schema versioning
- `DB_DROP_SCHEMA=false` — safe