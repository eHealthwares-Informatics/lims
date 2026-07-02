# rxsoft-lis-backend — Status

## What it does

Laboratory Information System (LIS) backend service. Manages lab test definitions, sample types, reference ranges, locations, and related lab operations. Uses a generic resource routing pattern where a single controller handles 12 entity types.

## Modules

| Module | Description |
|---|---|
| **lis** | Single module — all LIS entities and operations |

### Entities

| Entity | Purpose |
|---|---|
| **TestDefinition** | Lab test definitions with LOINC, categories, sample types, UOM, programs |
| **SampleType** | Specimen/sample types |
| **TestCategory** | Test categorization |
| **ReferenceRange** | Normal value ranges per test (by gender) |
| **Location** | Lab locations with type, parent hierarchy, attribute values |
| **LocationTypeDefinition** | Location types with allowed child types and attribute definitions |
| **AttributeDefinition** | Attribute definitions for location types |
| **AttributeValue** | Values for location attributes |
| **Program** | Health programs (M2M with test definitions) |
| **Priority** | Test priority levels |
| **RejectionReason** | Sample rejection reasons |
| **Loinc** | LOINC coding system integration |
| **Uom** | Units of measure |

## Entrypoints

- `src/main.ts` — NestJS bootstrap, Swagger at `/docs`

## Status

| Aspect | Status |
|---|---|
| **Pagination** | Universal via shared `ListQueryDto`. Uses `.skip().take()` with `.getManyAndCount()`. |
| **Response envelope** | `{ data, meta: { page, limit, total } }` — consistent. |
| **Search** | Per-resource search column map with ILIKE. Different columns searched per entity type. |
| **Sort** | `sortBy` + `sortOrder` in shared DTO. No column allow-list (any column name accepted). |
| **Architecture** | Generic resource routing — single controller + single service method handles all 12 entity types via `:resource` path param. Dynamic relation loading and serialization per resource. |
| **Soft-delete** | All entities extend `LisBaseEntity` with `@DeleteDateColumn`. Queries filter by `deleted_at IS NULL`. |
| **Tests** | Integration tests exist (`npm run test:integration` with `--runInBand`). |
