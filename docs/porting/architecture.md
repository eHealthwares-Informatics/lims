# OpenELIS → RxSoft LIS — Architecture

## Core Data Model

OpenELIS's central entity chain is:

```
ORDER → SAMPLE → SAMPLE_ITEM → ANALYSIS → RESULT
```

RxSoft LIS maps this to:

```
Order → OrderItem → Result
```

with a new **Sample** entity (Phase 2) tracking physical specimens independently of tests.

### Entity Mapping

| OpenELIS | RxSoft LIS | Status |
|---|---|---|
| `SAMPLE` | `Sample` (new) | Phase 2 |
| `SAMPLE_ITEM` | OrderItem (existing) | Phase 1 |
| `ANALYSIS` | OrderItem (merged) | Phase 1 |
| `RESULT` | Result | Phase 1 |
| `TEST` | TestDefinition | Phase 1 |
| `PATIENT` | Order (embedded) | Phase 1 |
| `PROVIDER` | Order (embedded reference) | Phase 1 |
| `STATUS_OF_SAMPLE` | Status enum + statuses table | Phase 2 |
| `RESULT_SIGNATURE` | ResultSignature (new) | Phase 2 |
| `SAMPLE_PROJECTS` | Order.programs (many-to-many) | Phase 1 |
| `ELECTRONIC_ORDER` | LIS interop endpoint | Phase 1 |

### Key Deviations from OpenELIS

- **Patient data is embedded in Order** — no separate PatientEntity FK. The PatientsService queries distinct patients from orders via GROUP BY.
- **No separate ANALYSIS table** — OpenELIS's `ANALYSIS` (linking SampleItem to Test) is merged into OrderItem, which directly references a TestDefinition.
- **JWT auth** — LIS uses shared JWT_ACCESS_SECRET from rxsoft-backend, not OpenELIS's `SYSTEM_USER` / `LOGIN_USER` tables.
- **No billing** — OpenELIS uses Odoo; RxSoft LIS has no billing module.

## Workflow: Status-Driven (Phase 2)

Phase 2 introduces a status workflow modeled after OpenELIS's `STATUS_OF_SAMPLE` table:

```
Order:     Entered → Started → Finished
Sample:    Collected → Received → InProgress → Disposed
Result:    Pending → TechnicalReview → Finalized
```

Each status is a database record with a `type` discriminator. Transitions are validated against `StatusRules`.

## Integration Architecture

```
HealthStack (port 8085)
    ↓ LAB/Lab Order HL7
Interoperability Switch (port 3000)
    ↓ POST /lis/interop/order (X-API-Key)
RxSoft LIS Backend (port 8091)
    ↓ JWT (shared JWT_ACCESS_SECRET)
RxSoft Admin UI (port 5173)
    ↓ JWT
RxSoft Backend (port 8080, auth provider)
```

- HealthStack → Switch → LIS: lab order creation (Phase 1)
- LIS → Switch: result webhook cron every 2 min (Phase 1)
- LIS → HealthStack: result push (Phase 2, planned)

## Database

SQLite in development, PostgreSQL in production (TypeORM).
