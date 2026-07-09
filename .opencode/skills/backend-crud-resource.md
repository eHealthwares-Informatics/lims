# Backend CRUD Resource — rxsoft-lis-backend

## Purpose

Scaffold a new CRUD resource extending `BaseLisService`.

## When to invoke

When adding a new entity that needs CRUD endpoints in the LIS.

## When not to invoke

For non-CRUD logic (webhooks, analytics, interop).

## Inputs

- **Entity name** (PascalCase)
- **Table name** (snake_case, prefixed `lis_`)
- **Fields** with TypeORM decorators

## Workflow

1. Create entity in `src/modules/lis/entities/` extending `LisBaseEntity` (provides `id`, `organizationId`, `locationId`, timestamps, soft-delete).
2. Add to the `entities/index.ts` export.
3. Create DTO in `src/modules/lis/dto/` with `class-validator` decorators.
4. Create service extending `BaseLisService<EntityName>` — override `searchColumns()`, `sortColumn()`, `relations()` as needed.
5. Create controller with standard endpoints: `list`, `export`, `get`, `create`, `patch`, `delete` — all using the base pattern. Use `ListQueryDto` for list endpoints.
6. Register in `LisModule` with `TypeOrmModule.forFeature([Entity])`.

## Refactoring

Always add the entity to `entities/index.ts` for clean imports.