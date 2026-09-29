# Graph Report - lims  (2026-09-23)

## Corpus Check
- 181 files · ~36,434 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1953 nodes · 4710 edges · 155 communities (90 shown, 65 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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
- Backend CRUD Resource — rxsoft-lis-backend
- Backend List Endpoint — rxsoft-lis-backend
- Auth Guard — rxsoft-lis-backend
- Seeding — rxsoft-lis-backend
- analytes.controller.ts
- AddCreatedByIdToOrders1740129600000
- nest-cli.json
- dependencies
- tsconfig.build.json
- data-source.ts
- ELECTRONIC_ORDER (OpenELIS)
- HealthStack
- RxSoft LIS Backend
- OrderItem
- PATIENT (OpenELIS)
- PROVIDER (OpenELIS)
- Result
- RESULT (OpenELIS)
- RxSoft Backend
- SAMPLE_ITEM (OpenELIS)
- SAMPLE (OpenELIS)
- SAMPLE_PROJECTS (OpenELIS)
- STATUS_OF_SAMPLE (OpenELIS)
- Interoperability Switch
- TEST (OpenELIS)
- Panels
- Patients
- Phase 1 - CRUD & Integration
- Phase 2 - Order Lifecycle & Validation
- Frontend samples page
- Frontend statuses page
- Order status workflow
- Result signatures frontend
- Result status workflow
- Sample entity
- Status entity CRUD
- Status history audit trail
- Status transition validation
- Validation dashboard
- npm install
- npm run seed
- npm run start:dev
- AttributeDefinition
- AttributeValue
- LIS Module
- Location
- LocationTypeDefinition
- Loinc
- Priority
- Program
- ReferenceRange
- RejectionReason
- SampleType
- src/main.ts
- TestCategory
- TestDefinition
- Uom

## God Nodes (most connected - your core abstractions)
1. `RequestUser` - 242 edges
2. `CurrentUser` - 241 edges
3. `tenantFromUser()` - 241 edges
4. `ListQueryDto` - 105 edges
5. `TenantContext` - 97 edges
6. `LisBaseEntity` - 79 edges
7. `BaseLisService` - 77 edges
8. `toCsv()` - 63 edges
9. `TestDefinitionEntity` - 39 edges
10. `CodeGeneratorService` - 39 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `AppModule`  [INFERRED]
  src/main.ts → src/app.module.ts
- `CreateAnalyteDto` --inherits--> `NamedCodeDto`  [EXTRACTED]
  src/modules/lis/dto/analyte.dto.ts → src/modules/lis/dto/named-code.dto.ts
- `CreateLocationTypeDefinitionDto` --inherits--> `NamedCodeDto`  [EXTRACTED]
  src/modules/lis/dto/location-type-definition.dto.ts → src/modules/lis/dto/named-code.dto.ts
- `CreatePanelDto` --inherits--> `NamedCodeDto`  [EXTRACTED]
  src/modules/lis/dto/panel.dto.ts → src/modules/lis/dto/named-code.dto.ts
- `CreatePriorityDto` --inherits--> `NamedCodeDto`  [EXTRACTED]
  src/modules/lis/dto/priority.dto.ts → src/modules/lis/dto/named-code.dto.ts

## Import Cycles
- None detected.

## Communities (155 total, 65 thin omitted)

### Community 0 - "Controller Utilities & Decorators"
Cohesion: 0.21
Nodes (10): ListQueryDto, ApiPropertyOptional, IsIn, IsInt, IsOptional, IsString, Max, Min (+2 more)

### Community 1 - "Test Definition Entities"
Cohesion: 0.07
Nodes (32): InjectRepository, LoincEntity, Column, Entity, Index, MethodEntity, Column, Entity (+24 more)

### Community 2 - "Result Signatures Controller"
Cohesion: 0.15
Nodes (11): ResultSignaturesController, ApiTags, Body, Controller, Post, CreateSignatureDto, ApiProperty, ApiPropertyOptional (+3 more)

### Community 3 - "Base Entity & Status Enums"
Cohesion: 0.16
Nodes (11): StatusDomain, StatusEntity, Column, Entity, Index, StatusHistoryEntity, Column, Entity (+3 more)

### Community 4 - "DTOs & Code Generation"
Cohesion: 0.14
Nodes (11): CreateMethodDto, NamedCodeDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString, CodeGenerationMode (+3 more)

### Community 5 - "Status History & Services"
Cohesion: 0.18
Nodes (5): InjectRepository, InjectRepository, StatusesService, Injectable, InjectRepository

### Community 6 - "Attribute & Location Entities"
Cohesion: 0.09
Nodes (24): AttributeDefinitionEntity, Column, Entity, JoinColumn, ManyToOne, AttributeValueEntity, Column, Entity (+16 more)

### Community 7 - "QC Lots Controller"
Cohesion: 0.11
Nodes (16): QcLotsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+8 more)

### Community 8 - "List/Export Operations"
Cohesion: 0.15
Nodes (11): RequestUser, ApiOperation, Get, Header, Query, Delete, Param, Patch (+3 more)

### Community 9 - "Orders Controller"
Cohesion: 0.17
Nodes (15): ApiQuery, CurrentUser, OrdersController, ApiOperation, ApiTags, Body, Controller, Delete (+7 more)

### Community 10 - "Reference Ranges Controller"
Cohesion: 0.07
Nodes (27): ReferenceRangesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+19 more)

### Community 11 - "Location Types Controller"
Cohesion: 0.09
Nodes (18): LocationTypesController, ApiOperation, ApiTags, Body, Controller, Get, Header, Post (+10 more)

### Community 12 - "Test Definitions Controller"
Cohesion: 0.07
Nodes (26): TestDefinitionsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+18 more)

### Community 13 - "Sample Types Controller"
Cohesion: 0.18
Nodes (8): Body, Delete, Param, Patch, Put, SampleTypesService, Injectable, InjectRepository

### Community 14 - "Tenant User & Operations"
Cohesion: 0.40
Nodes (4): ApiOperation, Get, Header, Query

### Community 15 - "Attribute Definitions Controller"
Cohesion: 0.10
Nodes (17): AttributeDefinitionsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+9 more)

### Community 17 - "Users Proxy Controller"
Cohesion: 0.10
Nodes (11): Headers, ApiOperation, ApiTags, Controller, Get, Param, Query, UsersProxyController (+3 more)

### Community 18 - "Results Controller"
Cohesion: 0.13
Nodes (15): ResultsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+7 more)

### Community 19 - "Current User & List/Export"
Cohesion: 0.32
Nodes (4): ApiOperation, Get, Header, Query

### Community 20 - "Locations Controller"
Cohesion: 0.17
Nodes (9): LocationsController, ApiTags, Body, Controller, Param, Patch, Put, LocationsService (+1 more)

### Community 21 - "Programs Controller"
Cohesion: 0.09
Nodes (19): ProgramsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+11 more)

### Community 22 - "Methods Controller"
Cohesion: 0.11
Nodes (16): MethodsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+8 more)

### Community 23 - "Reference Range Entities"
Cohesion: 0.10
Nodes (20): ReferenceRangeEntity, Column, Entity, JoinColumn, ManyToOne, ResultEntity, Column, Entity (+12 more)

### Community 24 - "Statuses Controller"
Cohesion: 0.20
Nodes (9): Post, CreateStatusDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsIn, IsInt, IsOptional (+1 more)

### Community 25 - "Test Sections Controller"
Cohesion: 0.09
Nodes (20): TestSectionsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+12 more)

### Community 26 - "NestJS Dependencies"
Cohesion: 0.10
Nodes (21): dependencies, axios, class-transformer, class-validator, @nestjs/axios, @nestjs/common, @nestjs/config, @nestjs/core (+13 more)

### Community 27 - "Seed Scripts & Priority Entity"
Cohesion: 0.09
Nodes (19): CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, AnalyteEntity, Column, Entity, Index, LisBaseEntity (+11 more)

### Community 28 - "Priorities Controller"
Cohesion: 0.09
Nodes (20): PrioritiesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+12 more)

### Community 29 - "EQA Entities"
Cohesion: 0.07
Nodes (28): EqaEnrollmentsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+20 more)

### Community 30 - "Samples Controller"
Cohesion: 0.09
Nodes (23): SamplesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+15 more)

### Community 31 - "QC Alerts Controller"
Cohesion: 0.14
Nodes (12): QcAlertsController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+4 more)

### Community 32 - "QC Results Controller"
Cohesion: 0.13
Nodes (13): QcResultsController, ApiOperation, ApiTags, Controller, Delete, Get, Header, Param (+5 more)

### Community 33 - "Rejection Reasons Controller"
Cohesion: 0.13
Nodes (15): RejectionReasonsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+7 more)

### Community 34 - "Test Categories Controller"
Cohesion: 0.12
Nodes (15): TestCategoriesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+7 more)

### Community 35 - "LOINC Controller"
Cohesion: 0.27
Nodes (7): LoincController, ApiOperation, ApiTags, Controller, Get, Header, Query

### Community 36 - "TypeScript Configuration"
Cohesion: 0.08
Nodes (29): EqaResultsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+21 more)

### Community 37 - "Units of Measurement Controller"
Cohesion: 0.15
Nodes (12): ApiTags, Body, Controller, Delete, Param, Patch, Post, Put (+4 more)

### Community 39 - "Base Service & Tenant Context"
Cohesion: 0.09
Nodes (10): TenantContext, BaseLisService, ListResponse, Injectable, Domain, ORDER_SEQUENCE, RESULT_SEQUENCE, SAMPLE_SEQUENCE (+2 more)

### Community 40 - "Panels Controller & Service"
Cohesion: 0.09
Nodes (19): PanelsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+11 more)

### Community 41 - "QC Result Entity & Service"
Cohesion: 0.14
Nodes (15): QcAlertEntity, Column, Entity, JoinColumn, ManyToOne, QcLotEntity, QcLotTestConfig, Column (+7 more)

### Community 42 - "Panel Entities"
Cohesion: 0.19
Nodes (10): PanelEntity, Column, Entity, OneToMany, PanelItemEntity, Column, Entity, JoinColumn (+2 more)

### Community 43 - "Phase 2 Order Lifecycle"
Cohesion: 0.07
Nodes (28): Analyzer Integration, Auth, Calculated Results, Core Domain (5 entities), Derived Views (1 entity), EQA, Frontend, Integration (+20 more)

### Community 44 - "Dev Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, jest, @nestjs/cli, prettier, supertest, ts-jest, ts-loader, ts-node (+5 more)

### Community 45 - "Create QC Result DTO"
Cohesion: 0.17
Nodes (10): Body, Post, CreateQcResultDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsDateString, IsNumber (+2 more)

### Community 46 - "Sample & Transition DTOs"
Cohesion: 0.07
Nodes (26): EqaProgramsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+18 more)

### Community 47 - "Patients Controller & Service"
Cohesion: 0.08
Nodes (24): PatientsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+16 more)

### Community 48 - "Order Entities"
Cohesion: 0.09
Nodes (26): OrderEntity, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OrderItemEntity (+18 more)

### Community 49 - "App Module & Seeding"
Cohesion: 0.16
Nodes (3): InjectDataSource, DashboardService, Injectable

### Community 50 - "JWT Auth Guard & Integration"
Cohesion: 0.15
Nodes (8): AppModule, Module, JwtAuthGuard, Injectable, bootstrap(), resourcePayloads, LisModule, Module

### Community 51 - "Create LOINC DTO"
Cohesion: 0.25
Nodes (7): Post, CreateLoincDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString

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
Cohesion: 0.08
Nodes (25): QaChecklistItemsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+17 more)

### Community 56 - "API Key Guard & Health"
Cohesion: 0.18
Nodes (7): Public(), ApiKeyGuard, Injectable, HealthController, Controller, Get, Public

### Community 58 - "LIS Interop DTOs"
Cohesion: 0.33
Nodes (8): CreateInteropOrderDto, InteropItemDto, InteropPatientDto, IsArray, IsOptional, IsString, Type, ValidateNested

### Community 59 - "QC Alert DTOs"
Cohesion: 0.36
Nodes (7): AcknowledgeAlertDto, CreateQcAlertDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsOptional, IsString

### Community 60 - "QC Alert Entity"
Cohesion: 0.08
Nodes (26): ReferenceTablesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+18 more)

### Community 61 - "NPM Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, migration:revert, migration:run, start, start:dev, start:prod, test:integration

### Community 62 - "List/Export Endpoints"
Cohesion: 0.09
Nodes (21): ObservationHistoryTypesController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+13 more)

### Community 63 - "Create Panel DTO"
Cohesion: 0.09
Nodes (21): SourceOfSamplesController, ApiTags, Body, Controller, Delete, Param, Patch, Post (+13 more)

### Community 64 - "List/Export Endpoints"
Cohesion: 0.13
Nodes (15): AnalytesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+7 more)

### Community 65 - "List/Export Endpoints"
Cohesion: 0.12
Nodes (15): CodeGeneratorController, ApiOperation, ApiTags, Controller, Get, Query, GenerateCodeQueryDto, ApiPropertyOptional (+7 more)

### Community 66 - "List/Export Endpoints"
Cohesion: 0.27
Nodes (7): SampleTypesController, ApiOperation, ApiTags, Controller, Get, Header, Query

### Community 67 - "List/Export Endpoints"
Cohesion: 0.20
Nodes (6): LisAttributeDataType, EqaEnrollmentStatus, EqaEvaluation, OrderStatus, ResultStatus, SampleStatus

### Community 68 - "List/Export Endpoints"
Cohesion: 0.16
Nodes (10): tenantFromUser(), Delete, ApiOperation, Get, Header, Query, ApiOperation, Get (+2 more)

### Community 69 - "List/Export Endpoints"
Cohesion: 0.33
Nodes (4): ApiOperation, Get, Header, Query

### Community 70 - "Westgard QC Evaluation"
Cohesion: 0.24
Nodes (6): AlertSeverity, WestgardRule, ViolationInput, Injectable, WestgardService, WestgardViolation

### Community 71 - "Status Transitions Service"
Cohesion: 0.18
Nodes (6): ReportChannel, ReportDeliveryService, SendReportOptions, Injectable, ReportPdfService, Injectable

### Community 72 - "Result Webhook Service"
Cohesion: 0.16
Nodes (13): Cron, IsEmail, CreateResultDto, IsOptional, IsString, SendReportDto, IsIn, IsOptional (+5 more)

### Community 74 - "Export & List Endpoints"
Cohesion: 0.12
Nodes (15): Adding CRUD resources, Architecture, Auth, Auth (complete), DB, Key commands, Key entities (32), List endpoints (+7 more)

### Community 75 - "Test Section Entity"
Cohesion: 0.12
Nodes (15): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, incremental, module (+7 more)

### Community 76 - "Package Metadata"
Cohesion: 0.40
Nodes (4): license, name, private, version

### Community 77 - "Health Controller"
Cohesion: 0.22
Nodes (14): CreateOrderDto, OrderAssignmentDto, OrderItemDto, OrderSampleDto, StepProgressDto, IsArray, IsBoolean, IsNumber (+6 more)

### Community 78 - "QC Alert Entity & Service"
Cohesion: 0.19
Nodes (8): ResultSignatureEntity, Column, Entity, JoinColumn, ManyToOne, ResultSignaturesService, Injectable, InjectRepository

### Community 79 - "LOINC Service"
Cohesion: 0.18
Nodes (8): Body, Delete, Param, Patch, Put, LoincService, Injectable, InjectRepository

### Community 80 - "Nest CLI Config"
Cohesion: 0.20
Nodes (9): ApiBearerAuth, DashboardController, ApiOperation, ApiTags, Controller, Get, Param, Query (+1 more)

### Community 81 - "README & Setup"
Cohesion: 0.18
Nodes (10): Architecture, Commands, Database, Environment Variables, Integration Pattern, Patterns, Quick Start, RxSoft LIS Backend (+2 more)

### Community 82 - "Patient DTO"
Cohesion: 0.20
Nodes (9): MaxLength, Post, CreateSampleTypeDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsNumber, IsOptional (+1 more)

### Community 83 - "Patient Entity"
Cohesion: 0.20
Nodes (11): CreateQcLotDto, QcLotTestConfigDto, ApiProperty, ApiPropertyOptional, IsArray, IsBoolean, IsDateString, IsNumber (+3 more)

### Community 85 - "TS Build Config"
Cohesion: 0.22
Nodes (8): Post, CreateLocationDto, ApiProperty, ApiPropertyOptional, IsArray, IsBoolean, IsOptional, IsString

### Community 89 - "Status Docs & Main"
Cohesion: 0.29
Nodes (6): Entities, Entrypoints, Modules, rxsoft-lis-backend — Status, Status, What it does

### Community 90 - "Architecture Documentation"
Cohesion: 0.25
Nodes (7): Core Data Model, Database, Entity Mapping, Integration Architecture, Key Deviations from OpenELIS, OpenELIS → RxSoft LIS — Architecture, Workflow: Status-Driven (Phase 2)

### Community 97 - "List/Export Endpoints"
Cohesion: 0.15
Nodes (12): StatusesController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Header (+4 more)

### Community 98 - "Backend CRUD Resource — rxsoft-lis-backend"
Cohesion: 0.25
Nodes (7): Backend CRUD Resource — rxsoft-lis-backend, Inputs, Purpose, Refactoring, When not to invoke, When to invoke, Workflow

### Community 99 - "Backend List Endpoint — rxsoft-lis-backend"
Cohesion: 0.25
Nodes (7): Backend List Endpoint — rxsoft-lis-backend, Inputs, Purpose, Refactoring consistency, When not to invoke, When to invoke, Workflow

### Community 100 - "Auth Guard — rxsoft-lis-backend"
Cohesion: 0.33
Nodes (5): Auth Guard — rxsoft-lis-backend, Purpose, Refactoring, When to invoke, Workflow

### Community 101 - "Seeding — rxsoft-lis-backend"
Cohesion: 0.33
Nodes (5): Purpose, Refactoring, Seeding — rxsoft-lis-backend, When to invoke, Workflow

### Community 104 - "nest-cli.json"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

## Knowledge Gaps
- **224 isolated node(s):** `@opencode-ai/plugin`, `config`, `$schema`, `collection`, `sourceRoot` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequestUser` connect `List/Export Operations` to `Controller Utilities & Decorators`, `Result Signatures Controller`, `DTOs & Code Generation`, `QC Lots Controller`, `Orders Controller`, `Reference Ranges Controller`, `Location Types Controller`, `Test Definitions Controller`, `Sample Types Controller`, `Tenant User & Operations`, `Attribute Definitions Controller`, `Results Controller`, `Current User & List/Export`, `Locations Controller`, `Programs Controller`, `Methods Controller`, `Statuses Controller`, `Test Sections Controller`, `Priorities Controller`, `Samples Controller`, `QC Alerts Controller`, `QC Results Controller`, `Rejection Reasons Controller`, `Test Categories Controller`, `LOINC Controller`, `Units of Measurement Controller`, `Panels Controller & Service`, `Create QC Result DTO`, `Patients Controller & Service`, `JWT Auth Guard & Integration`, `Create LOINC DTO`, `Generic Delete/List/Export`, `Create, Generate, Validate`, `QC Alert Entity`, `List/Export Endpoints`, `Create Panel DTO`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `Result Webhook Service`, `LOINC Service`, `Nest CLI Config`, `Patient DTO`, `TS Build Config`, `List/Export Endpoints`, `analytes.controller.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `tenantFromUser()` connect `List/Export Endpoints` to `Controller Utilities & Decorators`, `Result Signatures Controller`, `DTOs & Code Generation`, `QC Lots Controller`, `List/Export Operations`, `Orders Controller`, `Reference Ranges Controller`, `Location Types Controller`, `Test Definitions Controller`, `Sample Types Controller`, `Tenant User & Operations`, `Attribute Definitions Controller`, `Results Controller`, `Current User & List/Export`, `Locations Controller`, `Programs Controller`, `Methods Controller`, `Statuses Controller`, `Test Sections Controller`, `Priorities Controller`, `Samples Controller`, `QC Alerts Controller`, `QC Results Controller`, `Rejection Reasons Controller`, `Test Categories Controller`, `LOINC Controller`, `Units of Measurement Controller`, `Panels Controller & Service`, `Create QC Result DTO`, `Patients Controller & Service`, `JWT Auth Guard & Integration`, `Create LOINC DTO`, `Generic Delete/List/Export`, `Create, Generate, Validate`, `QC Alert Entity`, `List/Export Endpoints`, `Create Panel DTO`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `Result Webhook Service`, `LOINC Service`, `Nest CLI Config`, `Patient DTO`, `TS Build Config`, `List/Export Endpoints`, `analytes.controller.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `CurrentUser` connect `Orders Controller` to `Controller Utilities & Decorators`, `Result Signatures Controller`, `DTOs & Code Generation`, `QC Lots Controller`, `List/Export Operations`, `Reference Ranges Controller`, `Location Types Controller`, `Test Definitions Controller`, `Sample Types Controller`, `Tenant User & Operations`, `Attribute Definitions Controller`, `Results Controller`, `Current User & List/Export`, `Locations Controller`, `Programs Controller`, `Methods Controller`, `Statuses Controller`, `Test Sections Controller`, `Priorities Controller`, `Samples Controller`, `QC Alerts Controller`, `QC Results Controller`, `Rejection Reasons Controller`, `Test Categories Controller`, `LOINC Controller`, `Units of Measurement Controller`, `Panels Controller & Service`, `Create QC Result DTO`, `Patients Controller & Service`, `JWT Auth Guard & Integration`, `Create LOINC DTO`, `Generic Delete/List/Export`, `Create, Generate, Validate`, `QC Alert Entity`, `List/Export Endpoints`, `Create Panel DTO`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `List/Export Endpoints`, `Result Webhook Service`, `LOINC Service`, `Nest CLI Config`, `Patient DTO`, `TS Build Config`, `List/Export Endpoints`, `analytes.controller.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `@opencode-ai/plugin`, `config`, `$schema` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Test Definition Entities` be split into smaller, more focused modules?**
  _Cohesion score 0.0743321718931475 - nodes in this community are weakly interconnected._
- **Should `DTOs & Code Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.135632183908046 - nodes in this community are weakly interconnected._
- **Should `Attribute & Location Entities` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._