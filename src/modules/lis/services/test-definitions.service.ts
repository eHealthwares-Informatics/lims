import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  LoincEntity,
  MethodEntity,
  ProgramEntity,
  SampleTypeEntity,
  TestCategoryEntity,
  TestDefinitionEntity,
  TestSectionEntity,
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
    @InjectRepository(MethodEntity) private readonly methodRepo: Repository<MethodEntity>,
    @InjectRepository(TestSectionEntity) private readonly testSectionRepo: Repository<TestSectionEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'test_definitions');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  protected relations(): string[] {
    return ['loinc', 'category', 'method', 'testSection', 'sampleTypes', 'uom', 'programs', 'referenceRanges'];
  }

  protected serialize(item: TestDefinitionEntity): any {
    return {
      ...item,
      sampleTypeIds: item.sampleTypes?.map((s) => s.id) ?? [],
      programIds: item.programs?.map((p) => p.id) ?? [],
      loincId: item.loinc?.id,
      categoryId: item.category?.id,
      methodId: item.method?.id,
      testSectionId: item.testSection?.id,
      uomId: item.uom?.id,
    };
  }

  async create(payload: CreateTestDefinitionDto, tenant?: TenantContext): Promise<any> {
    const [loinc, category, uom, sampleTypes, programs, method, testSection] = await Promise.all([
      payload.loincId ? this.loincRepo.findOneBy({ id: payload.loincId }) : null,
      payload.categoryId ? this.categoryRepo.findOneBy({ id: payload.categoryId }) : null,
      payload.uomId ? this.uomRepo.findOneBy({ id: payload.uomId }) : null,
      payload.sampleTypeIds?.length ? this.sampleTypeRepo.findBy({ id: In(payload.sampleTypeIds) }) : [],
      payload.programIds?.length ? this.programRepo.findBy({ id: In(payload.programIds) }) : [],
      payload.methodId ? this.methodRepo.findOneBy({ id: payload.methodId }) : null,
      payload.testSectionId ? this.testSectionRepo.findOneBy({ id: payload.testSectionId }) : null,
    ]);
    const test = await this.repo.save(
      this.repo.create({
        code: payload.code ?? this.codes.generate('test-definitions', payload.name),
        name: payload.name,
        description: payload.description ?? null,
        loinc,
        category,
        method,
        testSection,
        resultType: payload.resultType,
        validationRules: payload.validationRules ?? null,
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

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    for (const [key, value] of Object.entries(payload)) {
      switch (key) {
        case 'methodId':
          item.method = value ? await this.methodRepo.findOneBy({ id: value as string }) : null;
          break;
        case 'testSectionId':
          item.testSection = value ? await this.testSectionRepo.findOneBy({ id: value as string }) : null;
          break;
        case 'loincId':
          item.loinc = value ? await this.loincRepo.findOneBy({ id: value as string }) : null;
          break;
        case 'categoryId':
          item.category = value ? await this.categoryRepo.findOneBy({ id: value as string }) : null;
          break;
        case 'uomId':
          item.uom = value ? await this.uomRepo.findOneBy({ id: value as string }) : null;
          break;
        case 'sampleTypeIds':
          item.sampleTypes = (value as string[])?.length ? await this.sampleTypeRepo.findBy({ id: In(value as string[]) }) : [];
          break;
        case 'programIds':
          item.programs = (value as string[])?.length ? await this.programRepo.findBy({ id: In(value as string[]) }) : [];
          break;
        default:
          if (!['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'deletedAt', 'deleted_at', 'organizationId', 'organization_id', 'locationId', 'location_id'].includes(key)) {
            (item as any)[key] = value;
          }
      }
    }
    await this.repo.save(item);
    return this.findOne(id, tenant);
  }

  async replace(id: string, payload: CreateTestDefinitionDto, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    const [loinc, category, uom, sampleTypes, programs, method, testSection] = await Promise.all([
      payload.loincId ? this.loincRepo.findOneBy({ id: payload.loincId }) : null,
      payload.categoryId ? this.categoryRepo.findOneBy({ id: payload.categoryId }) : null,
      payload.uomId ? this.uomRepo.findOneBy({ id: payload.uomId }) : null,
      payload.sampleTypeIds?.length ? this.sampleTypeRepo.findBy({ id: In(payload.sampleTypeIds) }) : [],
      payload.programIds?.length ? this.programRepo.findBy({ id: In(payload.programIds) }) : [],
      payload.methodId ? this.methodRepo.findOneBy({ id: payload.methodId }) : null,
      payload.testSectionId ? this.testSectionRepo.findOneBy({ id: payload.testSectionId }) : null,
    ]);
    const saved = await this.repo.save({
      ...item,
      code: payload.code ?? this.codes.generate('test-definitions', payload.name),
      name: payload.name,
      description: payload.description ?? null,
      loinc,
      category,
      method,
      testSection,
      resultType: payload.resultType,
      validationRules: payload.validationRules ?? null,
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
    });
    return this.findOne(saved.id, tenant);
  }
}
