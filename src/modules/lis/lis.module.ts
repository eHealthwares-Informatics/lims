import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnalyteEntity,
  AttributeDefinitionEntity,
  AttributeValueEntity,
  EqaEnrollmentEntity,
  EqaProgramEntity,
  EqaResultEntity,
  LocationEntity,
  LocationTypeDefinitionEntity,
  LoincEntity,
  MethodEntity,
  ObservationHistoryTypeEntity,
  OrderEntity,
  OrderItemEntity,
  PanelEntity,
  PanelItemEntity,
  PatientEntity,
  PriorityEntity,
  ProgramEntity,
  QaChecklistItemEntity,
  QaHoldEventEntity,
  ResultAmendmentEntity,
  QcAlertEntity,
  QcLotEntity,
  QcResultEntity,
  ReferenceRangeEntity,
  ReferenceTableEntity,
  RejectionReasonEntity,
  ResultEntity,
  ResultSignatureEntity,
  SampleEntity,
  SampleTypeEntity,
  SourceOfSampleEntity,
  StatusEntity,
  StatusHistoryEntity,
  TestCategoryEntity,
  TestDefinitionEntity,
  TestSectionEntity,
  UnitOfMeasurementEntity,
} from './entities';
import { CodeGeneratorService } from './services/code-generator.service';
import { BarcodeService } from './services/barcode.service';
import { ReportPdfService } from './services/report-pdf.service';
import { ReportDeliveryService } from './services/report-delivery.service';
import { LoincService } from './services/loinc.service';
import { SampleTypesService } from './services/sample-types.service';
import { RejectionReasonsService } from './services/rejection-reasons.service';
import { PrioritiesService } from './services/priorities.service';
import { TestCategoriesService } from './services/test-categories.service';
import { ProgramsService } from './services/programs.service';
import { LocationTypesService } from './services/location-types.service';
import { AttributeDefinitionsService } from './services/attribute-definitions.service';
import { LocationsService } from './services/locations.service';
import { TestDefinitionsService } from './services/test-definitions.service';
import { ReferenceRangesService } from './services/reference-ranges.service';
import { UnitsOfMeasurementService } from './services/units-of-measurement.service';
import { TestSectionsService } from './services/test-sections.service';
import { MethodsService } from './services/methods.service';
import { PanelsService } from './services/panels.service';
import { PatientsService } from './services/patients.service';
import { OrdersService } from './services/orders.service';
import { ResultsService } from './services/results.service';
import { ResultWebhookService } from './services/result-webhook.service';
import { ResultSignaturesService } from './services/result-signatures.service';
import { ResultAmendmentsService } from './services/result-amendments.service';
import { SamplesService } from './services/samples.service';
import { StatusesService } from './services/statuses.service';
import { StatusHistoryService } from './services/status-history.service';
import { UsersProxyService } from './services/users-proxy.service';
import { DashboardService } from './services/dashboard.service';
import { QcLotsService } from './services/qc-lots.service';
import { QcResultsService } from './services/qc-results.service';
import { QcAlertsService } from './services/qc-alerts.service';
import { WestgardService } from './services/westgard.service';
import { EqaProgramsService } from './services/eqa-programs.service';
import { EqaEnrollmentsService } from './services/eqa-enrollments.service';
import { EqaResultsService } from './services/eqa-results.service';
import { QaChecklistItemsService } from './services/qa-checklist-items.service';
import { QaHoldsService } from './services/qa-holds.service';
import { TatService } from './services/tat.service';
import { AnalytesService } from './services/analytes.service';
import { ObservationHistoryTypesService } from './services/observation-history-types.service';
import { ReferenceTablesService } from './services/reference-tables.service';
import { SourceOfSamplesService } from './services/source-of-samples.service';
import { AnalytesController } from './controllers/analytes.controller';
import { ObservationHistoryTypesController } from './controllers/observation-history-types.controller';
import { ReferenceTablesController } from './controllers/reference-tables.controller';
import { SourceOfSamplesController } from './controllers/source-of-samples.controller';
import { CodeGeneratorController } from './controllers/code-generator.controller';
import { BarcodeController } from './controllers/barcode.controller';
import { LoincController } from './controllers/loinc.controller';
import { SampleTypesController } from './controllers/sample-types.controller';
import { RejectionReasonsController } from './controllers/rejection-reasons.controller';
import { PrioritiesController } from './controllers/priorities.controller';
import { TestCategoriesController } from './controllers/test-categories.controller';
import { ProgramsController } from './controllers/programs.controller';
import { LocationTypesController } from './controllers/location-types.controller';
import { AttributeDefinitionsController } from './controllers/attribute-definitions.controller';
import { LocationsController } from './controllers/locations.controller';
import { TestDefinitionsController } from './controllers/test-definitions.controller';
import { ReferenceRangesController } from './controllers/reference-ranges.controller';
import { UnitsOfMeasurementController } from './controllers/units-of-measurement.controller';
import { TestSectionsController } from './controllers/test-sections.controller';
import { MethodsController } from './controllers/methods.controller';
import { PanelsController } from './controllers/panels.controller';
import { PatientsController } from './controllers/patients.controller';
import { OrdersController } from './controllers/orders.controller';
import { ResultsController } from './controllers/results.controller';
import { ResultSignaturesController } from './controllers/result-signatures.controller';
import { SamplesController } from './controllers/samples.controller';
import { StatusesController } from './controllers/statuses.controller';
import { UsersProxyController } from './controllers/users-proxy.controller';
import { LisInteropController } from './controllers/lis-interop.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { QcLotsController } from './controllers/qc-lots.controller';
import { QcResultsController } from './controllers/qc-results.controller';
import { QcAlertsController } from './controllers/qc-alerts.controller';
import { EqaProgramsController } from './controllers/eqa-programs.controller';
import { EqaEnrollmentsController } from './controllers/eqa-enrollments.controller';
import { EqaResultsController } from './controllers/eqa-results.controller';
import { QaChecklistItemsController } from './controllers/qa-checklist-items.controller';
import { TatController } from './controllers/tat.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      AnalyteEntity,
      AttributeDefinitionEntity,
      AttributeValueEntity,
      LocationEntity,
      LocationTypeDefinitionEntity,
      LoincEntity,
      MethodEntity,
      ObservationHistoryTypeEntity,
      PanelEntity,
      PanelItemEntity,
      PriorityEntity,
      ProgramEntity,
      ReferenceRangeEntity,
      ReferenceTableEntity,
      RejectionReasonEntity,
      SampleTypeEntity,
      SourceOfSampleEntity,
      TestCategoryEntity,
      TestDefinitionEntity,
      TestSectionEntity,
      UnitOfMeasurementEntity,
      PatientEntity,
      OrderEntity,
      OrderItemEntity,
      ResultEntity,
      ResultSignatureEntity,
      SampleEntity,
      StatusEntity,
      StatusHistoryEntity,
      QaChecklistItemEntity,
      QaHoldEventEntity,
      ResultAmendmentEntity,
      QcLotEntity,
      QcResultEntity,
      QcAlertEntity,
      EqaProgramEntity,
      EqaEnrollmentEntity,
      EqaResultEntity,
    ]),
  ],
  controllers: [
    CodeGeneratorController,
    BarcodeController,
    LoincController,
    SampleTypesController,
    RejectionReasonsController,
    PrioritiesController,
    TestCategoriesController,
    ProgramsController,
    LocationTypesController,
    AttributeDefinitionsController,
    LocationsController,
    TestDefinitionsController,
    ReferenceRangesController,
    UnitsOfMeasurementController,
    TestSectionsController,
    MethodsController,
    PanelsController,
    PatientsController,
    OrdersController,
    ResultsController,
    ResultSignaturesController,
    SamplesController,
    StatusesController,
    UsersProxyController,
    LisInteropController,
    QcLotsController,
    QcResultsController,
    QcAlertsController,
    EqaProgramsController,
    EqaEnrollmentsController,
    EqaResultsController,
    DashboardController,
    AnalytesController,
    ObservationHistoryTypesController,
    ReferenceTablesController,
    SourceOfSamplesController,
    QaChecklistItemsController,
    TatController,
  ],
  providers: [
    CodeGeneratorService,
    BarcodeService,
    ReportPdfService,
    ReportDeliveryService,
    LoincService,
    SampleTypesService,
    RejectionReasonsService,
    PrioritiesService,
    TestCategoriesService,
    ProgramsService,
    LocationTypesService,
    AttributeDefinitionsService,
    LocationsService,
    TestDefinitionsService,
    ReferenceRangesService,
    UnitsOfMeasurementService,
    TestSectionsService,
    MethodsService,
    PanelsService,
    PatientsService,
    OrdersService,
    ResultsService,
    ResultSignaturesService,
    ResultWebhookService,
    ResultAmendmentsService,
    SamplesService,
    StatusesService,
    StatusHistoryService,
    UsersProxyService,
    DashboardService,
    QcLotsService,
    QcResultsService,
    QcAlertsService,
    WestgardService,
    EqaProgramsService,
    EqaEnrollmentsService,
    EqaResultsService,
    AnalytesService,
    ObservationHistoryTypesService,
    ReferenceTablesService,
    SourceOfSamplesService,
    QaChecklistItemsService,
    QaHoldsService,
    TatService,
  ],
  exports: [
    CodeGeneratorService,
    LoincService,
    SampleTypesService,
    RejectionReasonsService,
    PrioritiesService,
    TestCategoriesService,
    ProgramsService,
    LocationTypesService,
    AttributeDefinitionsService,
    LocationsService,
    TestDefinitionsService,
    ReferenceRangesService,
    UnitsOfMeasurementService,
    TestSectionsService,
    MethodsService,
    PanelsService,
    PatientsService,
    OrdersService,
    ResultsService,
    ResultSignaturesService,
    ResultWebhookService,
    SamplesService,
    StatusesService,
    StatusHistoryService,
    UsersProxyService,
    QcLotsService,
    QcResultsService,
    QcAlertsService,
    WestgardService,
    EqaProgramsService,
    EqaEnrollmentsService,
    EqaResultsService,
  ],
})
export class LisModule {}
