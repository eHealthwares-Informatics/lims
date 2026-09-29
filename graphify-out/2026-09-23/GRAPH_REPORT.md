# Graph Report - /Users/john/develop/rxsoft/rxsoft-lis-backend  (2026-07-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1348 nodes · 3295 edges · 98 communities (86 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 3,313 input · 5,891 output

## Graph Freshness
- Built from commit: `2bb8a5e6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Controller Utilities & Decorators
- Test Definition Entities
- Result Signatures Controller
- Base Entity & Status Enums
- DTOs & Code Generation
- Status History & Services
- Attribute & Location Entities
- QC Lots Controller
- List/Export Operations
- Orders Controller
- Reference Ranges Controller
- Location Types Controller
- Test Definitions Controller
- Sample Types Controller
- Tenant User & Operations
- Attribute Definitions Controller
- Core Entities & Phase 1
- Users Proxy Controller
- Results Controller
- Current User & List/Export
- Locations Controller
- Programs Controller
- Methods Controller
- Reference Range Entities
- Statuses Controller
- Test Sections Controller
- NestJS Dependencies
- Seed Scripts & Priority Entity
- Priorities Controller
- EQA Entities
- Samples Controller
- QC Alerts Controller
- QC Results Controller
- Rejection Reasons Controller
- Test Categories Controller
- LOINC Controller
- TypeScript Configuration
- Units of Measurement Controller
- Sample Entity & Service
- Base Service & Tenant Context
- Panels Controller & Service
- QC Result Entity & Service
- Panel Entities
- Phase 2 Order Lifecycle
- Dev Dependencies
- Create QC Result DTO
- Sample & Transition DTOs
- Patients Controller & Service
- Order Entities
- App Module & Seeding
- JWT Auth Guard & Integration
- Create LOINC DTO
- LIS Interop Controller
- Jest Test Config
- Permissions Guard & Decorator
- Generic Delete/List/Export
- API Key Guard & Health
- Create, Generate, Validate
- LIS Interop DTOs
- QC Alert DTOs
- QC Alert Entity
- NPM Scripts
- List/Export Endpoints
- Create Panel DTO
- List/Export Endpoints
- List/Export Endpoints
- List/Export Endpoints
- List/Export Endpoints
- List/Export Endpoints
- List/Export Endpoints
- Westgard QC Evaluation
- Status Transitions Service
- Result Webhook Service
- System Components & UI
- Export & List Endpoints
- Test Section Entity
- Package Metadata
- Health Controller
- QC Alert Entity & Service
- LOINC Service
- Nest CLI Config
- README & Setup
- Patient DTO
- Patient Entity
- OpenELIS Analysis Items
- TS Build Config
- Sample Phase 2 Reference
- Sample Statuses
- Jest Integration Config
- Status Docs & Main
- Architecture Documentation
- Order Statuses
- Result Signature
- Result Statuses
- Phase 3 Reports & QC
- Phase 4 Advanced Features
- List/Export Endpoints

## God Nodes (most connected - your core abstractions)
1. `RequestUser` - 173 edges
2. `CurrentUser` - 172 edges
3. `tenantFromUser()` - 172 edges
4. `ListQueryDto` - 83 edges
5. `LisBaseEntity` - 69 edges
6. `BaseLisService` - 57 edges
7. `toCsv()` - 47 edges
8. `TestDefinitionEntity` - 39 edges
9. `TenantContext` - 35 edges
10. `CodeGeneratorService` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Phase 1 - CRUD & Integration` --references--> `SampleType`  [EXTRACTED]
  docs/porting/features.md → status.md
- `Phase 1 - CRUD & Integration` --references--> `TestCategory`  [EXTRACTED]
  docs/porting/features.md → status.md
- `Phase 1 - CRUD & Integration` --references--> `ReferenceRange`  [EXTRACTED]
  docs/porting/features.md → status.md
- `Phase 1 - CRUD & Integration` --references--> `Loinc`  [EXTRACTED]
  docs/porting/features.md → status.md
- `Phase 1 - CRUD & Integration` --references--> `Uom`  [EXTRACTED]
  docs/porting/features.md → status.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Integration Architecture** — docs_porting_architecture_healthstack, docs_porting_architecture_switch, docs_porting_architecture_lis_backend, docs_porting_architecture_admin_ui, docs_porting_architecture_rxsoft_backend [EXTRACTED 1.00]
- **OpenELIS to RxSoft Core Mapping** — docs_porting_architecture_order, docs_porting_architecture_orderitem, docs_porting_architecture_result, docs_porting_architecture_sample [EXTRACTED 1.00]
- **Phase 2 Current Sprint Items** — docs_porting_progress_status_entity_crud, docs_porting_progress_status_transition, docs_porting_progress_status_history, docs_porting_progress_order_workflow, docs_porting_progress_sample_entity, docs_porting_progress_result_workflow, docs_porting_progress_frontend_samples, docs_porting_progress_frontend_statuses, docs_porting_progress_result_signatures_frontend, docs_porting_progress_validation_dashboard [EXTRACTED 1.00]

## Communities (98 total, 12 thin omitted)

### Community 0 - "Controller Utilities & Decorators"
Cohesion: 0.21
Nodes (10): Max, ListQueryDto, ApiPropertyOptional, IsIn, IsInt, IsOptional, IsString, Min (+2 more)

### Community 1 - "Test Definition Entities"
Cohesion: 0.08
Nodes (28): InjectRepository, LoincEntity, Column, Entity, Index, ProgramEntity, Column, Entity (+20 more)

### Community 2 - "Result Signatures Controller"
Cohesion: 0.09
Nodes (22): ResultSignaturesController, ApiOperation, ApiTags, Body, Controller, Get, Param, Post (+14 more)

### Community 3 - "Base Entity & Status Enums"
Cohesion: 0.15
Nodes (15): CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, LisBaseEntity, OrderStatus, ResultStatus, SampleStatus, StatusDomain (+7 more)

### Community 4 - "DTOs & Code Generation"
Cohesion: 0.17
Nodes (10): CreateMethodDto, NamedCodeDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString, ListResponse (+2 more)

### Community 5 - "Status History & Services"
Cohesion: 0.09
Nodes (15): StatusHistoryEntity, Column, Entity, JoinColumn, ManyToOne, InjectRepository, ResultsService, Injectable (+7 more)

### Community 6 - "Attribute & Location Entities"
Cohesion: 0.10
Nodes (25): AttributeDefinitionEntity, LisAttributeDataType, Column, Entity, JoinColumn, ManyToOne, AttributeValueEntity, Column (+17 more)

### Community 7 - "QC Lots Controller"
Cohesion: 0.09
Nodes (22): IsObject, QcLotsController, ApiTags, Body, Controller, Delete, Param, Patch (+14 more)

### Community 8 - "List/Export Operations"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 9 - "Orders Controller"
Cohesion: 0.09
Nodes (19): OrdersController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+11 more)

### Community 10 - "Reference Ranges Controller"
Cohesion: 0.08
Nodes (20): IsEnum, ReferenceRangesController, ApiTags, Body, Controller, Delete, Param, Patch (+12 more)

### Community 11 - "Location Types Controller"
Cohesion: 0.09
Nodes (16): LocationTypesController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+8 more)

### Community 12 - "Test Definitions Controller"
Cohesion: 0.09
Nodes (18): TestDefinitionsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+10 more)

### Community 13 - "Sample Types Controller"
Cohesion: 0.10
Nodes (18): MaxLength, SampleTypesController, ApiTags, Body, Controller, Delete, Param, Patch (+10 more)

### Community 14 - "Tenant User & Operations"
Cohesion: 0.11
Nodes (15): tenantFromUser(), ApiOperation, Delete, Get, Header, Param, Query, ApiOperation (+7 more)

### Community 15 - "Attribute Definitions Controller"
Cohesion: 0.10
Nodes (16): AttributeDefinitionsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+8 more)

### Community 16 - "Core Entities & Phase 1"
Cohesion: 0.10
Nodes (24): Order, PATIENT (OpenELIS), PROVIDER (OpenELIS), Result, RESULT (OpenELIS), SAMPLE_PROJECTS (OpenELIS), TEST (OpenELIS), Panels (+16 more)

### Community 17 - "Users Proxy Controller"
Cohesion: 0.11
Nodes (11): Headers, ApiOperation, ApiTags, Controller, Get, Param, Query, UsersProxyController (+3 more)

### Community 18 - "Results Controller"
Cohesion: 0.13
Nodes (15): ResultsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+7 more)

### Community 19 - "Current User & List/Export"
Cohesion: 0.10
Nodes (17): CurrentUser, ApiOperation, Get, Header, Query, ApiOperation, Get, Header (+9 more)

### Community 20 - "Locations Controller"
Cohesion: 0.10
Nodes (15): LocationsController, ApiTags, Body, Controller, Patch, Post, CreateLocationDto, ApiProperty (+7 more)

### Community 21 - "Programs Controller"
Cohesion: 0.11
Nodes (14): ProgramsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+6 more)

### Community 22 - "Methods Controller"
Cohesion: 0.11
Nodes (15): MethodsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+7 more)

### Community 23 - "Reference Range Entities"
Cohesion: 0.12
Nodes (17): OperatorEnum, ReferenceRangeEntity, ReferenceRangeGender, Column, Entity, JoinColumn, ManyToOne, ResultEntity (+9 more)

### Community 24 - "Statuses Controller"
Cohesion: 0.11
Nodes (16): StatusesController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+8 more)

### Community 25 - "Test Sections Controller"
Cohesion: 0.13
Nodes (14): TestSectionsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+6 more)

### Community 26 - "NestJS Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-transformer, class-validator, @nestjs/axios, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+11 more)

### Community 27 - "Seed Scripts & Priority Entity"
Cohesion: 0.15
Nodes (17): config, dataSource, run(), type, seedLis(), upsertBy(), PriorityEntity, Column (+9 more)

### Community 28 - "Priorities Controller"
Cohesion: 0.13
Nodes (13): PrioritiesController, ApiTags, Body, Controller, Patch, Post, CreatePriorityDto, ApiPropertyOptional (+5 more)

### Community 29 - "EQA Entities"
Cohesion: 0.13
Nodes (16): EqaEnrollmentEntity, EqaEnrollmentStatus, Column, Entity, JoinColumn, ManyToOne, EqaProgramEntity, Column (+8 more)

### Community 30 - "Samples Controller"
Cohesion: 0.16
Nodes (10): SamplesController, ApiOperation, ApiTags, Controller, Delete, Get, Header, Param (+2 more)

### Community 31 - "QC Alerts Controller"
Cohesion: 0.16
Nodes (10): QcAlertsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+2 more)

### Community 32 - "QC Results Controller"
Cohesion: 0.19
Nodes (10): QcResultsController, ApiOperation, ApiTags, Controller, Delete, Get, Header, Param (+2 more)

### Community 33 - "Rejection Reasons Controller"
Cohesion: 0.15
Nodes (11): RejectionReasonsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+3 more)

### Community 34 - "Test Categories Controller"
Cohesion: 0.15
Nodes (11): TestCategoriesController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+3 more)

### Community 35 - "LOINC Controller"
Cohesion: 0.13
Nodes (15): RequestUser, LoincController, ApiOperation, ApiTags, Controller, Delete, Get, Header (+7 more)

### Community 36 - "TypeScript Configuration"
Cohesion: 0.12
Nodes (15): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+7 more)

### Community 37 - "Units of Measurement Controller"
Cohesion: 0.16
Nodes (10): ApiTags, Body, Controller, Delete, Param, Patch, UnitsOfMeasurementController, Injectable (+2 more)

### Community 38 - "Sample Entity & Service"
Cohesion: 0.15
Nodes (8): SampleEntity, Column, Entity, JoinColumn, ManyToOne, SamplesService, Injectable, InjectRepository

### Community 39 - "Base Service & Tenant Context"
Cohesion: 0.31
Nodes (3): TenantContext, BaseLisService, Injectable

### Community 40 - "Panels Controller & Service"
Cohesion: 0.18
Nodes (8): PanelsController, ApiTags, Controller, Delete, Param, Patch, PanelsService, Injectable

### Community 41 - "QC Result Entity & Service"
Cohesion: 0.16
Nodes (8): QcResultEntity, Column, Entity, JoinColumn, ManyToOne, QcResultsService, Injectable, InjectRepository

### Community 42 - "Panel Entities"
Cohesion: 0.19
Nodes (10): PanelEntity, Column, Entity, OneToMany, PanelItemEntity, Column, Entity, JoinColumn (+2 more)

### Community 43 - "Phase 2 Order Lifecycle"
Cohesion: 0.27
Nodes (13): docs/porting/features.md, Phase 2 - Order Lifecycle & Validation, docs/porting/progress.md, Frontend samples page, Frontend statuses page, Order status workflow, Result signatures frontend, Result status workflow (+5 more)

### Community 44 - "Dev Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, jest, @nestjs/cli, prettier, supertest, ts-jest, ts-loader, ts-node (+5 more)

### Community 45 - "Create QC Result DTO"
Cohesion: 0.17
Nodes (10): Body, Post, CreateQcResultDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsDateString, IsNumber (+2 more)

### Community 46 - "Sample & Transition DTOs"
Cohesion: 0.27
Nodes (10): Body, Post, CreateSampleDto, TransitionOrderStatusDto, TransitionResultStatusDto, ApiProperty, ApiPropertyOptional, IsNumber (+2 more)

### Community 47 - "Patients Controller & Service"
Cohesion: 0.18
Nodes (7): PatientsController, ApiTags, Controller, Param, PatientsService, Injectable, InjectRepository

### Community 48 - "Order Entities"
Cohesion: 0.17
Nodes (12): OrderEntity, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OrderItemEntity (+4 more)

### Community 49 - "App Module & Seeding"
Cohesion: 0.25
Nodes (6): InjectDataSource, AppModule, Module, DatabaseSeedService, Injectable, bootstrap()

### Community 50 - "JWT Auth Guard & Integration"
Cohesion: 0.20
Nodes (5): JwtAuthGuard, Injectable, resourcePayloads, LisModule, Module

### Community 51 - "Create LOINC DTO"
Cohesion: 0.20
Nodes (8): Body, Post, CreateLoincDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString

### Community 52 - "LIS Interop Controller"
Cohesion: 0.20
Nodes (9): HttpCode, LisInteropController, ApiOperation, ApiTags, Body, Controller, Post, Public (+1 more)

### Community 53 - "Jest Test Config"
Cohesion: 0.20
Nodes (10): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+2 more)

### Community 54 - "Permissions Guard & Decorator"
Cohesion: 0.24
Nodes (4): PermissionsGuard, Injectable, UserWithPermissions, permissionMatches()

### Community 55 - "Generic Delete/List/Export"
Cohesion: 0.22
Nodes (6): ApiOperation, Delete, Get, Header, Param, Query

### Community 56 - "API Key Guard & Health"
Cohesion: 0.31
Nodes (3): Public(), ApiKeyGuard, Injectable

### Community 58 - "LIS Interop DTOs"
Cohesion: 0.33
Nodes (8): CreateInteropOrderDto, InteropItemDto, InteropPatientDto, IsArray, IsOptional, IsString, Type, ValidateNested

### Community 59 - "QC Alert DTOs"
Cohesion: 0.36
Nodes (7): AcknowledgeAlertDto, CreateQcAlertDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString

### Community 60 - "QC Alert Entity"
Cohesion: 0.25
Nodes (6): QcAlertEntity, Column, Entity, JoinColumn, ManyToOne, InjectRepository

### Community 61 - "NPM Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, seed, start, start:dev, start:prod, test:integration

### Community 62 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 63 - "Create Panel DTO"
Cohesion: 0.29
Nodes (6): Body, Post, CreatePanelDto, ApiPropertyOptional, IsArray, IsOptional

### Community 64 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 65 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 66 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 67 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 68 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 69 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 70 - "Westgard QC Evaluation"
Cohesion: 0.33
Nodes (3): Injectable, WestgardService, WestgardViolation

### Community 71 - "Status Transitions Service"
Cohesion: 0.29
Nodes (6): Domain, ORDER_SEQUENCE, RESULT_SEQUENCE, SAMPLE_SEQUENCE, SEQUENCES, VALID_TRANSITIONS

### Community 72 - "Result Webhook Service"
Cohesion: 0.33
Nodes (4): Cron, ResultWebhookService, Injectable, InjectRepository

### Community 73 - "System Components & UI"
Cohesion: 0.33
Nodes (6): RxSoft Admin UI, ELECTRONIC_ORDER (OpenELIS), HealthStack, RxSoft LIS Backend, RxSoft Backend, Interoperability Switch

### Community 74 - "Export & List Endpoints"
Cohesion: 0.40
Nodes (4): ApiOperation, Get, Header, Query

### Community 75 - "Test Section Entity"
Cohesion: 0.33
Nodes (5): TestSectionEntity, Column, Entity, Index, InjectRepository

### Community 76 - "Package Metadata"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 77 - "Health Controller"
Cohesion: 0.40
Nodes (4): HealthController, Controller, Get, Public

### Community 78 - "QC Alert Entity & Service"
Cohesion: 0.80
Nodes (3): AlertSeverity, WestgardRule, ViolationInput

### Community 79 - "LOINC Service"
Cohesion: 0.40
Nodes (3): LoincService, Injectable, InjectRepository

### Community 80 - "Nest CLI Config"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

### Community 81 - "README & Setup"
Cohesion: 0.50
Nodes (3): npm install, npm run seed, npm run start:dev

### Community 82 - "Patient DTO"
Cohesion: 0.50
Nodes (3): CreatePatientDto, IsOptional, IsString

### Community 83 - "Patient Entity"
Cohesion: 0.50
Nodes (4): PatientEntity, Column, Entity, Index

### Community 84 - "OpenELIS Analysis Items"
Cohesion: 0.67
Nodes (3): ANALYSIS (OpenELIS), OrderItem, SAMPLE_ITEM (OpenELIS)

### Community 97 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

## Knowledge Gaps
- **120 isolated node(s):** `config`, `$schema`, `collection`, `sourceRoot`, `name` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tenantFromUser()` connect `Tenant User & Operations` to `Controller Utilities & Decorators`, `Result Signatures Controller`, `QC Lots Controller`, `List/Export Operations`, `Orders Controller`, `Reference Ranges Controller`, `Location Types Controller`, `Test Definitions Controller`, `Sample Types Controller`, `Attribute Definitions Controller`, `Results Controller`, `Current User & List/Export`, `Locations Controller`, `Programs Controller`, `Methods Controller`, `Statuses Controller`, `Test Sections Controller`, `Priorities Controller`, `Samples Controller`, `QC Alerts Controller`, `QC Results Controller`, `Rejection Reasons Controller`, `Test Categories Controller`, `LOINC Controller`, `Units of Measurement Controller`, `Panels Controller & Service`, `Create QC Result DTO`, `Sample & Transition DTOs`, `Patients Controller & Service`, `Create LOINC DTO`, `Generic Delete/List/Export`, `Create, Generate, Validate`, `List/Export Endpoints`, `Create Panel DTO`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `Export & List Endpoints`, `List/Export Endpoints`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `RequestUser` connect `LOINC Controller` to `Controller Utilities & Decorators`, `Result Signatures Controller`, `QC Lots Controller`, `List/Export Operations`, `Orders Controller`, `Reference Ranges Controller`, `Location Types Controller`, `Test Definitions Controller`, `Sample Types Controller`, `Tenant User & Operations`, `Attribute Definitions Controller`, `Results Controller`, `Current User & List/Export`, `Locations Controller`, `Programs Controller`, `Methods Controller`, `Statuses Controller`, `Test Sections Controller`, `Priorities Controller`, `Samples Controller`, `QC Alerts Controller`, `QC Results Controller`, `Rejection Reasons Controller`, `Test Categories Controller`, `Units of Measurement Controller`, `Panels Controller & Service`, `Create QC Result DTO`, `Sample & Transition DTOs`, `Patients Controller & Service`, `Create LOINC DTO`, `Generic Delete/List/Export`, `Create, Generate, Validate`, `List/Export Endpoints`, `Create Panel DTO`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `Export & List Endpoints`, `List/Export Endpoints`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `Current User & List/Export` to `Controller Utilities & Decorators`, `Result Signatures Controller`, `QC Lots Controller`, `List/Export Operations`, `Orders Controller`, `Reference Ranges Controller`, `Location Types Controller`, `Test Definitions Controller`, `Sample Types Controller`, `Tenant User & Operations`, `Attribute Definitions Controller`, `Results Controller`, `Locations Controller`, `Programs Controller`, `Methods Controller`, `Statuses Controller`, `Test Sections Controller`, `Priorities Controller`, `Samples Controller`, `QC Alerts Controller`, `QC Results Controller`, `Rejection Reasons Controller`, `Test Categories Controller`, `LOINC Controller`, `Units of Measurement Controller`, `Panels Controller & Service`, `Create QC Result DTO`, `Sample & Transition DTOs`, `Patients Controller & Service`, `Create LOINC DTO`, `Generic Delete/List/Export`, `Create, Generate, Validate`, `List/Export Endpoints`, `Create Panel DTO`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `Export & List Endpoints`, `List/Export Endpoints`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `config`, `$schema`, `collection` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test Definition Entities` be split into smaller, more focused modules?**
  _Cohesion score 0.08412698412698413 - nodes in this community are weakly interconnected._
- **Should `Result Signatures Controller` be split into smaller, more focused modules?**
  _Cohesion score 0.08907563025210084 - nodes in this community are weakly interconnected._
- **Should `Base Entity & Status Enums` be split into smaller, more focused modules?**
  _Cohesion score 0.1497326203208556 - nodes in this community are weakly interconnected._