import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AttributeDefinitionEntity,
  AttributeValueEntity,
  LocationEntity,
  LocationTypeDefinitionEntity,
  LoincEntity,
  MethodEntity,
  OrderEntity,
  OrderItemEntity,
  PanelEntity,
  PanelItemEntity,
  PatientEntity,
  PriorityEntity,
  ProgramEntity,
  ReferenceRangeEntity,
  RejectionReasonEntity,
  ResultEntity,
  SampleTypeEntity,
  TestCategoryEntity,
  TestDefinitionEntity,
  TestSectionEntity,
  UnitOfMeasurementEntity,
} from './entities';
import { CodeGeneratorService } from './services/code-generator.service';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttributeDefinitionEntity,
      AttributeValueEntity,
      LocationEntity,
      LocationTypeDefinitionEntity,
      LoincEntity,
      MethodEntity,
      PanelEntity,
      PanelItemEntity,
      PriorityEntity,
      ProgramEntity,
      ReferenceRangeEntity,
      RejectionReasonEntity,
      SampleTypeEntity,
      TestCategoryEntity,
      TestDefinitionEntity,
      TestSectionEntity,
      UnitOfMeasurementEntity,
      PatientEntity,
      OrderEntity,
      OrderItemEntity,
      ResultEntity,
    ]),
  ],
  controllers: [
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
  ],
  providers: [
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
  ],
})
export class LisModule {}
