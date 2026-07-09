# Backend List Endpoint — rxsoft-lis-backend

## Purpose

Create or fix list/search endpoints following the `BaseLisService` pattern and `BACKEND_SEARCH_ARCHITECTURE.md`.

## When to invoke

When adding or modifying a list endpoint in any LIS module.

## When not to invoke

For single-entity retrieval.

## Inputs

- **Resource name** (e.g., `loinc`, `sample-types`, `test-definitions`)
- **Searchable columns**
- **Sort column overrides**

## Workflow

1. Extend `BaseLisService<T>` — it already provides paginated `.list()` with:
   - Soft-delete filter (`deleted_at IS NULL`)
   - Tenant scoping via `applyTenantFilter()`
   - ILIKE search via `searchColumns()` (default: `['name', 'code']`)
   - Sorting via `defaultSort()` (default: `{alias}.created_at`)
   - Pagination via `qb.skip().take()`

2. Override `searchColumns()` and `defaultSort()` if needed.

3. Use `src/shared/dto/list-query.dto.ts` (`ListQueryDto`) as the query parameter in the controller.

4. Controller returns `{ data, meta: { page, limit, total } }`.

5. Add a `GET /export` endpoint returning `text/csv` using `src/shared/utils/csv.ts` if needed (convention in this package).

## Refactoring consistency

Known deviations:
- **No column allow-list for sortBy** — any column name is accepted. Add one when touching the endpoint:
  ```typescript
  const ALLOWED_SORT_BY = ['name', 'code', 'createdAt', 'updatedAt'];
  ```
- **No filter-by-field parameters** — only `search` is supported. Add specific filter DTOs when needed.