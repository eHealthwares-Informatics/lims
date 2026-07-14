import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  LoincEntity,
  ProgramEntity,
  SampleTypeEntity,
  TestCategoryEntity,
  TestDefinitionEntity,
  UnitOfMeasurementEntity,
} from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateTestDefinitionDto } from '../dto/test-definition.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class TestDefinitionsService extends BaseLisService<TestDefinitionEntity> {
  constructor(
    @InjectRepository(TestDefinitionEntity) repo: Repository<TestDefinitionEntity>,
    @InjectRepository(LoincEntity) private readonly loincRepo: Repository<LoincEntity>,
    @InjectRepository(TestCategoryEntity) private readonly categoryRepo: Repository<TestCategoryEntity>,
    @InjectRepository(UnitOfMeasurementEntity) private readonly uomRepo: Repository<UnitOfMeasurementEntity>,
    @InjectRepository(SampleTypeEntity) private readonly sampleTypeRepo: Repository<SampleTypeEntity>,
    @InjectRepository(ProgramEntity) private readonly programRepo: Repository<ProgramEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'test_definitions');
  }

  protected searchColumns(): string[] {
    return ['name', 'code', 'methodology'];
  }

  protected relations(): string[] {
    return ['loinc', 'category', 'sampleTypes', 'uom', 'programs', 'referenceRanges'];
  }

  protected serialize(item: TestDefinitionEntity): any {
    return {
      ...item,
      sampleTypeIds: item.sampleTypes?.map((s) => s.id) ?? [],
      programIds: item.programs?.map((p) => p.id) ?? [],
      loincId: item.loinc?.id,
      categoryId: item.category?.id,
      uomId: item.uom?.id,
    };
  }

  async create(payload: CreateTestDefinitionDto, tenant?: TenantContext): Promise<any> {
    const [loinc, category, uom, sampleTypes, programs] = await Promise.all([
      payload.loincId ? this.loincRepo.findOneBy({ id: payload.loincId }) : null,
      payload.categoryId ? this.categoryRepo.findOneBy({ id: payload.categoryId }) : null,
      payload.uomId ? this.uomRepo.findOneBy({ id: payload.uomId }) : null,
      payload.sampleTypeIds?.length ? this.sampleTypeRepo.findBy({ id: In(payload.sampleTypeIds) }) : [],
      payload.programIds?.length ? this.programRepo.findBy({ id: In(payload.programIds) }) : [],
    ]);
    const test = await this.repo.save(
      this.repo.create({
        code: payload.code ?? this.codes.generate('test-definitions', payload.name),
        name: payload.name,
        description: payload.description ?? null,
        loinc,
        category,
        methodology: payload.methodology ?? null,
        resultType: payload.resultType,
        sampleTypes,
        programs,
        uom,
        minValue: payload.minValue ?? null,
        maxValue: payload.maxValue ?? null,
        criticalMin: payload.criticalMin ?? null,
        criticalMax: payload.criticalMax ?? null,
        turnaroundTimeMinutes: payload.turnaroundTimeMinutes ?? null,
        testDurationMinutes: payload.testDurationMinutes ?? null,
        active: payload.active ?? true,
        reportable: payload.reportable ?? true,
      }),
    );
    return this.findOne(test.id);
  }
}
