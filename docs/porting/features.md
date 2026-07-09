# OpenELIS → RxSoft LIS — Features

## Phase 1 ✅ — CRUD Entities & Integration (Completed)

### Reference Data (12 entities)
- [x] UOMs (Units of Measure)
- [x] LOINC codes
- [x] Sample Types
- [x] Test Categories
- [x] Test Sections
- [x] Methods
- [x] Programs
- [x] Rejection Reasons
- [x] Priorities
- [x] Location Types
- [x] Locations
- [x] Attribute Definitions

### Core Domain (5 entities)
- [x] Test Definitions (with LOINC, method, category, unit mappings)
- [x] Reference Ranges (age/gender-specific normal + critical)
- [x] Panels (multi-test groupings)
- [x] Orders (with embedded patient fields)
- [x] Results (with entered/validated tracking)

### Derived Views (1 entity)
- [x] Patients (read-only, derived from orders)

### Integration
- [x] LIS interop endpoint (`POST /lis/interop/order`) with API key auth
- [x] LOINC → TestDefinition resolution
- [x] Inline patient fields in order creation
- [x] HealthStack `send-to-switch` hook (laboratory order filtering)
- [x] Switch seeder: `rxsoft-lis` AE, `canonical-to-lis-order` mapping, `route-order-rxsoft-lis` route
- [x] Result webhook cron (every 2 min → switch)
- [x] Switch `basePath` support

### Auth
- [x] JWT auth guard (global, shared JWT_ACCESS_SECRET)
- [x] `@Public()` decorator for opt-out
- [x] ApiKeyGuard for interop endpoint
- [x] `SKIP_AUTH` env bypass for tests

### Frontend
- [x] Individual pages (schema.ts + index.tsx) for all 18 resources
- [x] Individual route files for each resource
- [x] Sidebar navigation with static links

## Phase 2 🔄 — Order Lifecycle & Result Validation (In Progress)

### Order Workflow
- [x] Sample entity (physical specimen tracking)
- [x] Order status transitions (ENTERED → IN_PROGRESS → COMPLETED / CANCELLED)
- [x] Sample status transitions (COLLECTED → RECEIVED → IN_PROGRESS → DISPOSED / REJECTED)
- [x] Status management (statuses table with domain discriminator)
- [x] Status validation rules (forward-only, cancel-to-any)
- [x] Status history audit trail
- [x] Frontend: statuses page, samples page
- [ ] Frontend: status badges, transition buttons, status history

### Result Validation
- [x] Result status management (PENDING → TECHNICAL_REVIEW → FINALIZED / CANCELLED)
- [x] Result signatures (two-level: technical + supervisory)
- [x] Signature enforcement (technical req'd for review, both req'd for finalize)
- [x] Validation dashboard (filter by status)
- [ ] QA holds (hold/release results)
- [ ] Result correction/revision tracking
- [ ] Frontend: validation workflow UI, inline signature capture

### Sample Tracking
- [ ] Barcode generation (labels, printing)
- [x] Collection tracking (collector, date, conditions)
- [ ] Transport/receipt tracking
- [ ] Storage hierarchy (room → device → rack → shelf → box)
- [ ] Aliquot management (parent-child sample items)
- [ ] Sample disposal workflow

## Phase 3 📋 — Reports & QC (Planned)

### Reporting
- [ ] Patient reports (PDF)
- [ ] TAT (turnaround time) reports
- [ ] Workload statistics
- [ ] QC reports

### Quality Control
- [ ] QC lot tracking
- [ ] QC result entry
- [ ] Westgard rule evaluation
- [ ] QC alerts

### EQA
- [ ] EQA program enrollment
- [ ] EQA result submission
- [ ] EQA performance tracking

## Phase 4 🔧 — Advanced Features (Future)

### Analyzer Integration
- [ ] Analyzer instrument management
- [ ] Result file parsing (ASTM, HL7)
- [ ] Bidirectional analyzer communication

### Reflex Testing
- [ ] Reflex rule configuration
- [ ] Automatic reflex triggering

### Calculated Results
- [ ] Calculation definitions
- [ ] Auto-calculated results

### Patient Identity
- [ ] Multiple patient identities
- [ ] Patient merge/dedup
- [ ] Identity document tracking
