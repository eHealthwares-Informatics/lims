import { DataSource, Repository } from 'typeorm';
import {
  AnalyteEntity,
  LoincEntity,
  MethodEntity,
  ObservationHistoryTypeEntity,
  PanelEntity,
  PanelItemEntity,
  ProgramEntity,
  ReferenceRangeEntity,
  ReferenceTableEntity,
  ReferenceRangeGender,
  OperatorEnum,
  SampleTypeEntity,
  SourceOfSampleEntity,
  TestDefinitionEntity,
  TestSectionEntity,
  UnitOfMeasurementEntity,
} from '../../modules/lis/entities';
import { readCsv, boolValue } from './read-csv';

const RESULT_TYPE_MAP: Record<string, string> = {
  N: 'NUMERIC',
  D: 'DICTIONARY',
  R: 'TEXT',
  A: 'TEXT',
  T: 'NUMERIC',
  M: 'DICTIONARY',
  C: 'DICTIONARY',
};

const GENDER_MAP: Record<string, ReferenceRangeGender> = {
  F: ReferenceRangeGender.FEMALE,
  M: ReferenceRangeGender.MALE,
  '': ReferenceRangeGender.DEFAULT,
};

const MAX_AGE_CAP = 150;

function finiteNumber(value: string | undefined, fallback: string | null): string | null {
  if (value === undefined || value === '') return fallback;
  const trimmed = value.trim();
  if (trimmed === 'Infinity' || trimmed === '-Infinity') return fallback;
  const n = Number(trimmed);
  if (Number.isNaN(n)) return fallback;
  return String(n);
}

async function upsert(repo: Repository<any>, keyColumn: string, keyValue: string | number, payload: Record<string, any>): Promise<any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) clean[k] = v;
  }
  const existing = await repo.findOne({ where: { [keyColumn]: keyValue, deletedAt: null } as any });
  if (existing) {
    return repo.save({ ...existing, ...clean });
  }
  return repo.save(repo.create(clean));
}

function uniqueCode(code: string, used: Set<string>): string {
  let candidate = code;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${code}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

export async function seedCsv(dataSource: DataSource): Promise<void> {
  const methodRepo = dataSource.getRepository(MethodEntity);
  const testSectionRepo = dataSource.getRepository(TestSectionEntity);
  const uomRepo = dataSource.getRepository(UnitOfMeasurementEntity);
  const sampleTypeRepo = dataSource.getRepository(SampleTypeEntity);
  const programRepo = dataSource.getRepository(ProgramEntity);
  const loincRepo = dataSource.getRepository(LoincEntity);
  const testRepo = dataSource.getRepository(TestDefinitionEntity);
  const rangeRepo = dataSource.getRepository(ReferenceRangeEntity);
  const panelRepo = dataSource.getRepository(PanelEntity);
  const panelItemRepo = dataSource.getRepository(PanelItemEntity);
  const sourceRepo = dataSource.getRepository(SourceOfSampleEntity);
  const analyteRepo = dataSource.getRepository(AnalyteEntity);
  const obsHistoryRepo = dataSource.getRepository(ObservationHistoryTypeEntity);
  const referenceTableRepo = dataSource.getRepository(ReferenceTableEntity);

  // openelisId -> UUID maps
  const methodMap = new Map<string, string>();
  const testSectionMap = new Map<string, string>();
  const uomMap = new Map<string, string>();
  const sampleTypeMap = new Map<string, string>();
  const testMap = new Map<string, string>();
  const panelMap = new Map<string, string>();

  const usedCodes = new Set<string>();

  // 1. methods
  for (const row of readCsv('lis_methods.csv')) {
    const code = uniqueCode(row.code, usedCodes);
    const item = await upsert(methodRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.description || null,
      active: boolValue(row.active, true),
    });
    if (row.openelisId) methodMap.set(row.openelisId, item.id);
  }

  // 2. test sections
  for (const row of readCsv('lis_test_sections.csv')) {
    const code = uniqueCode(row.code, usedCodes);
    const item = await upsert(testSectionRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.description || null,
      sortOrder: row.sortOrder ? Number(row.sortOrder) : 0,
      active: boolValue(row.active, true),
    });
    if (row.openelisId) testSectionMap.set(row.openelisId, item.id);
  }

  // 3. units of measurement
  for (const row of readCsv('lis_units_of_measurement.csv')) {
    const code = uniqueCode(row.code, usedCodes);
    const item = await upsert(uomRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.description || null,
      active: boolValue(row.active, true),
    });
    if (row.openelisId) uomMap.set(row.openelisId, item.id);
  }

  // 4. sample types
  for (const row of readCsv('lis_sample_types.csv')) {
    const key = uniqueCode(row.key, usedCodes);
    const item = await upsert(sampleTypeRepo, 'key', key, {
      key,
      name: row.name ?? key,
      description: row.description || null,
      accessionCode: row.accessionCode?.slice(0, 3) ?? key.slice(0, 3),
      defaultQuantity: row.defaultQuantity ? Number(row.defaultQuantity) : null,
      minimumQuantity: row.minimumQuantity ? Number(row.minimumQuantity) : null,
      unit: row.unit || null,
      containerType: row.containerType || null,
      collectionInstructions: row.collectionInstructions || null,
      storageRequirements: row.storageRequirements || null,
      active: boolValue(row.active, true),
    });
    if (row.openelisId) sampleTypeMap.set(row.openelisId, item.id);
  }

  // 5. programs
  for (const row of readCsv('lis_programs.csv')) {
    const code = uniqueCode(row.code, usedCodes);
    await upsert(programRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.description || null,
      active: boolValue(row.active, true),
    });
  }

  // 6. loinc codes referenced by test definitions
  const loincRows = readCsv('lis_test_definitions.csv').filter((r) => r.loinc?.trim());
  const loincCodeMap = new Map<string, string>();
  for (const row of loincRows) {
    const code = row.loinc.trim();
    const item = await upsert(loincRepo, 'code', code, {
      code,
      name: row.name ?? code,
      active: true,
    });
    loincCodeMap.set(code, item.id);
  }

  // 7. test definitions + result types
  const testResults = readCsv('lis_test_results.csv');
  const resultTypeByTest = new Map<string, string>();
  for (const row of testResults) {
    const mapped = RESULT_TYPE_MAP[row.testResultType] ?? 'NUMERIC';
    if (!resultTypeByTest.has(row.testId)) {
      resultTypeByTest.set(row.testId, mapped);
    }
  }

  for (const row of readCsv('lis_test_definitions.csv')) {
    const code = uniqueCode(row.code, usedCodes);
    const methodId = row.methodId ? methodMap.get(row.methodId) : undefined;
    const testSectionId = row.testSectionId ? testSectionMap.get(row.testSectionId) : undefined;
    const uomId = row.uomId ? uomMap.get(row.uomId) : undefined;
    const loincId = row.loinc ? loincCodeMap.get(row.loinc.trim()) : undefined;
    const resultType = resultTypeByTest.get(row.openelisId) ?? 'NUMERIC';
    const item = await upsert(testRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.description || null,
      resultType,
      loinc: loincId ? { id: loincId } : undefined,
      method: methodId ? { id: methodId } : undefined,
      testSection: testSectionId ? { id: testSectionId } : undefined,
      uom: uomId ? { id: uomId } : undefined,
      active: boolValue(row.isActive, true),
      reportable: boolValue(row.isReportable, false),
    });
    if (row.openelisId) testMap.set(row.openelisId, item.id);
  }

  // 8. sampletype_tests -> M2M lis_test_definition_sample_types
  for (const row of readCsv('lis_sampletype_tests.csv')) {
    const testId = testMap.get(row.testId);
    const sampleTypeId = sampleTypeMap.get(row.sampleTypeId);
    if (!testId || !sampleTypeId) continue;
    const test = await testRepo.findOne({ where: { id: testId } as any, relations: ['sampleTypes'] });
    if (!test) continue;
    const already = test.sampleTypes?.some((s) => s.id === sampleTypeId);
    if (!already) {
      test.sampleTypes = [...(test.sampleTypes ?? []), { id: sampleTypeId } as SampleTypeEntity];
      await testRepo.save(test);
    }
  }

  // 9. reference ranges
  for (const row of readCsv('lis_reference_ranges.csv')) {
    const testId = testMap.get(row.testId);
    if (!testId) continue;
    const test = await testRepo.findOne({ where: { id: testId } as any, relations: ['uom'] });
    if (!test) continue;
    const gender = GENDER_MAP[row.gender ?? ''] ?? ReferenceRangeGender.DEFAULT;
    const minAge = row.minAge ? Number(row.minAge) : 0;
    const maxAgeRaw = row.maxAge && row.maxAge !== 'Infinity' ? Number(row.maxAge) : MAX_AGE_CAP;
    const existing = await rangeRepo.findOne({
      where: { test: { id: testId }, gender, minAge, maxAge: maxAgeRaw } as any,
    });
    if (existing) continue;
    await rangeRepo.save(
      rangeRepo.create({
        test: { id: testId } as TestDefinitionEntity,
        gender,
        minAge,
        maxAge: maxAgeRaw,
        lowValue: finiteNumber(row.lowNormal, '0') ?? '0',
        highValue: finiteNumber(row.highNormal, '0') ?? '0',
        criticalLow: finiteNumber(row.lowValid, null),
        criticalHigh: finiteNumber(row.highValid, null),
        unit: test.uom ?? null,
        alias: 'Default',
        operator: OperatorEnum.BETWEEN,
        active: true,
      }),
    );
  }

  // 10. panels
  const panelRows = readCsv('lis_panels.csv');
  for (let i = 0; i < panelRows.length; i += 1) {
    const row = panelRows[i];
    const code = uniqueCode(row.code, usedCodes);
    const item = await upsert(panelRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.description || null,
      active: boolValue(row.isActive, true),
    });
    panelMap.set(String(i + 1), item.id);
  }

  // 11. panel items
  for (const row of readCsv('lis_panel_items.csv')) {
    const panelId = panelMap.get(row.panelId);
    const testId = testMap.get(row.testId);
    if (!panelId || !testId) continue;
    const existing = await panelItemRepo.findOne({ where: { panel: { id: panelId }, test: { id: testId } } as any });
    if (existing) continue;
    await panelItemRepo.save(
      panelItemRepo.create({
        panel: { id: panelId } as PanelEntity,
        test: { id: testId } as TestDefinitionEntity,
        sortOrder: row.sortOrder ? Number(row.sortOrder) : 0,
      }),
    );
  }

  // 12. source of samples
  for (const row of readCsv('lis_source_of_samples.csv')) {
    await upsert(sourceRepo, 'code', row.code, {
      code: row.code,
      description: row.description ?? row.code,
      domain: row.domain || 'H',
      openelisId: row.openelisId || null,
    });
  }

  // 13. analytes
  for (const row of readCsv('lis_analytes.csv')) {
    const code = uniqueCode(row.code, usedCodes);
    await upsert(analyteRepo, 'code', code, {
      code,
      name: row.name ?? code,
      description: row.name ?? null,
      openelisId: row.openelisId || null,
      active: boolValue(row.isActive, true),
    });
  }

  // 14. observation history types
  for (const row of readCsv('lis_observation_history_types.csv')) {
    await upsert(obsHistoryRepo, 'typeName', row.typeName, {
      typeName: row.typeName,
      description: row.description || null,
      openelisId: row.openelisId || null,
    });
  }

  // 15. reference tables
  for (const row of readCsv('lis_reference_tables.csv')) {
    await upsert(referenceTableRepo, 'name', row.name, {
      name: row.name,
      keepHistory: boolValue(row.keepHistory, false),
      isHl7Encoded: boolValue(row.isHl7Encoded, false),
      openelisId: row.openelisId || null,
    });
  }
}
