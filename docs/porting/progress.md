# OpenELIS → RxSoft LIS — Porting Progress

## Overall Progress: 35%

| Phase | Items | Done | Percent |
|---|---|---|---|
| Phase 1 — CRUD & Integration | ~30 | 30 | 100% |
| Phase 2 — Workflow & Validation | ~20 | 0 | 0% |
| Phase 3 — Reports & QC | ~15 | 0 | 0% |
| Phase 4 — Advanced Features | ~15 | 0 | 0% |

## Phase 1 — Complete ✅

All 23 backend entities (12 reference + 11 core) with full CRUD, JWT auth, interop integration, and frontend pages.

## Phase 2 — In Progress 🔄

### Current Sprint

| Item | Status | Notes |
|---|---|---|
| Status entity + CRUD | ✅ Done | Database-driven with domain discriminator |
| Status transition validation | ✅ Done | Forward-only transitions with cancel-to-any support |
| Status history audit trail | ✅ Done | StatusHistory entity per transition |
| Order status workflow | ✅ Done | ENTERED → IN_PROGRESS → COMPLETED / CANCELLED |
| Sample entity | ✅ Done | Barcodes, collection tracking, statuses |
| Result status workflow | ✅ Done | PENDING → TECHNICAL_REVIEW → FINALIZED / CANCELLED |
| Frontend: samples page | ✅ Done | schema.ts + index.tsx |
| Frontend: statuses page | ✅ Done | schema.ts + index.tsx |
| Result signatures (two-level) | ✅ Done | Technical + supervisory approval, enforced on transition |
| Validation dashboard | ✅ Done | Status-filtered view with counts |
| Result signatures frontend | ✅ Done | schema.ts + index.tsx |
| QA holds | 🔜 Next | Hold/release results with QA events |
| Result correction/revision tracking | ⏳ Planned | Amend and supersede workflow |
| Sample storage hierarchy | ⏳ Planned | Room → Device → Rack → Shelf → Box |
| Shipment / referral tracking | ⏳ Planned | Send-out workflow |
| Barcode label generation | ⏳ Planned | Label configuration and print |

### Design Decisions (Phase 2)

1. **Simplify Sample**: RxSoft merges OpenELIS's `SAMPLE` and `SAMPLE_ITEM` into a single `Sample` entity with a `parentId` self-reference for aliquots. Sample has a `orderId` FK to Order, removing the need for `SAMPLE_HUMAN`.
2. **Status as DB records**: Following OpenELIS's pattern, all statuses are DB records with a `domain` discriminator. This allows admin users to add/customize statuses without code changes.
3. **Result signatures**: Modeled after OpenELIS's `RESULT_SIGNATURE` with `isSupervisor` flag. Two-level approval is optional per lab config.
4. **Status history**: New `StatusHistory` entity tracks all transitions with timestamp and userId for audit.

## Phase 3 & 4 — Not Started

See [features.md](./features.md) for full scope.
