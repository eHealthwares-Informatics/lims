import { DataSource } from 'typeorm';
import { seedCsv } from './seed-csv';
import {
  AttributeDefinitionEntity,
  EqaProgramEntity,
  LisAttributeDataType,
  LocationEntity,
  LocationTypeDefinitionEntity,
  LoincEntity,
  OperatorEnum,
  PriorityEntity,
  ProgramEntity,
  QcLotEntity,
  QaChecklistItemEntity,
  ReferenceRangeGender,
  ReferenceRangeEntity,
  RejectionReasonEntity,
  SampleTypeEntity,
  StatusEntity,
  TestCategoryEntity,
  TestDefinitionEntity,
  UnitOfMeasurementEntity,
} from '../../modules/lis/entities';

export async function seedLis(dataSource: DataSource) {
  const loincRepo = dataSource.getRepository(LoincEntity);
  const sampleTypeRepo = dataSource.getRepository(SampleTypeEntity);
  const rejectionRepo = dataSource.getRepository(RejectionReasonEntity);
  const priorityRepo = dataSource.getRepository(PriorityEntity);
  const categoryRepo = dataSource.getRepository(TestCategoryEntity);
  const programRepo = dataSource.getRepository(ProgramEntity);
  const locationTypeRepo = dataSource.getRepository(LocationTypeDefinitionEntity);
  const locationRepo = dataSource.getRepository(LocationEntity);
  const attrRepo = dataSource.getRepository(AttributeDefinitionEntity);
  const uomRepo = dataSource.getRepository(UnitOfMeasurementEntity);
  const testRepo = dataSource.getRepository(TestDefinitionEntity);
  const rangeRepo = dataSource.getRepository(ReferenceRangeEntity);
  const statusRepo = dataSource.getRepository(StatusEntity);

  const seedStatuses = async () => {
    for (const [code, name, domain, sortOrder] of [
      ['ENTERED', 'Entered', 'ORDER', 0],
      ['IN_PROGRESS', 'In Progress', 'ORDER', 1],
      ['COMPLETED', 'Completed', 'ORDER', 2],
      ['CANCELLED', 'Cancelled', 'ORDER', 9],
      ['COLLECTED', 'Collected', 'SAMPLE', 0],
      ['RECEIVED', 'Received', 'SAMPLE', 1],
      ['IN_PROGRESS', 'In Progress', 'SAMPLE', 2],
      ['DISPOSED', 'Disposed', 'SAMPLE', 3],
      ['REJECTED', 'Rejected', 'SAMPLE', 9],
      ['PENDING', 'Pending', 'RESULT', 0],
      ['TECHNICAL_REVIEW', 'Technical Review', 'RESULT', 1],
      ['FINALIZED', 'Finalized', 'RESULT', 2],
    ] as const) {
      await upsertBy(statusRepo, 'code', { code, name, description: name, domain, sortOrder, active: true });
    }
  };

  await seedStatuses();

  const qcLotRepo = dataSource.getRepository(QcLotEntity);
  const hgbTest = await testRepo.findOne({ where: { code: 'HGB' } });
  if (hgbTest) {
    await upsertBy(qcLotRepo, 'lotNumber', {
      controlName: 'Bio-Rad Liquichek Level 1',
      lotNumber: 'QC-2024-001',
      expiryDate: '2025-12-31',
      manufacturer: 'Bio-Rad',
      active: true,
      notes: 'Normal control level 1',
      testConfig: [
        { testDefinitionId: hgbTest.id, mean: 14.5, sd: 0.5, testName: 'Hemoglobin' },
      ],
    });
    await upsertBy(qcLotRepo, 'lotNumber', {
      controlName: 'Bio-Rad Liquichek Level 2',
      lotNumber: 'QC-2024-002',
      expiryDate: '2025-12-31',
      manufacturer: 'Bio-Rad',
      active: true,
      notes: 'Abnormal control level 2',
      testConfig: [
        { testDefinitionId: hgbTest.id, mean: 8.0, sd: 0.4, testName: 'Hemoglobin' },
      ],
    });
  }

  const loinc = await upsertBy(loincRepo, 'code', {
    code: '718-7',
    name: 'Hemoglobin [Mass/volume] in Blood',
    component: 'Hemoglobin',
    system: 'Blood',
    property: 'MCnc',
    scale: 'Qn',
    active: true,
  });
  await upsertBy(loincRepo, 'code', {
    code: '4548-4',
    name: 'Hemoglobin A1c/Hemoglobin.total in Blood',
    component: 'Hemoglobin A1c',
    system: 'Blood',
    property: 'MFr',
    scale: 'Qn',
    active: true,
  });

  for (const [accessionCode, name, key, defaultQuantity, minimumQuantity, unit, containerType] of [
    ['VAR', 'Actual type will be selected by user', 'Variable', null, null, null, null],
    ['PLA', 'Plasma', 'Plasma', 5, 3, 'mL', 'Plasma Separator Tube (PST)'],
    ['SER', 'Serum', 'Serum', 5, 3, 'mL', 'Serum Separator Tube (SST)'],
    ['WBL', 'Whole Blood', 'Whole Bld', 5, 3, 'mL', 'EDTA Tube'],
    ['URI', 'Urines', 'Urines', 10, 5, 'mL', 'Sterile urine container'],
    ['DRY', 'Dry Tube', 'Dry', null, null, null, 'Plain/Dry Tube'],
    ['EDT', 'EDTA Tube', 'EDTA', 4, 2, 'mL', 'EDTA Tube'],
    ['DBS', 'DBS', 'DBS', null, null, null, 'DBS card'],
    ['RSW', 'Respiratory Swab', 'Resp Swab', null, null, null, 'Swab with transport medium'],
    ['SPU', 'Sputum', 'Sputum', 5, 2, 'mL', 'Sterile sputum container'],
    ['FLD', 'Fluid', 'Fluid', 5, 2, 'mL', 'Sterile container'],
    ['HPS', 'Histopathology specimen', 'HPS', null, null, null, 'Formalin container'],
    ['IMM', 'Immunohistochemistry specimen', 'IMMUNO', null, null, null, 'Formalin container'],
    ['TAM', 'Tissue antemortem', 'TAM', null, null, null, 'Formalin container'],
    ['TMP', 'Tissue post mortem', 'TMP', null, null, null, 'Formalin container'],
  ]) {
    await upsertBy(sampleTypeRepo, 'key', {
      key,
      name,
      accessionCode,
      description: name,
      defaultQuantity,
      minimumQuantity,
      unit,
      containerType,
      active: true,
    });
  }

  for (const [code, name] of [
    ['REJ-HEM', 'Hemolyzed sample'],
    ['REJ-INS', 'Insufficient volume'],
    ['REJ-MIS', 'Missing patient identification'],
    ['REJ-CLO', 'Clotted sample'],
    ['REJ-LEK', 'Leaking container'],
  ]) {
    await upsertBy(rejectionRepo, 'code', { code, name, description: name, active: true });
  }

  for (const [code, name, index] of [
    ['PRI-ROUTINE', 'Routine', 10],
    ['PRI-URGENT', 'Urgent', 20],
    ['PRI-STAT', 'STAT', 30],
  ]) {
    await upsertBy(priorityRepo, 'code', { code, name, index, description: name, active: true });
  }

  const chemistry = await upsertBy(categoryRepo, 'code', { code: 'CAT-HEM', name: 'Hematology', description: 'Hematology tests', active: true });
  const program = await upsertBy(programRepo, 'code', { code: 'PRG-DEFAULT', name: 'Default LIS Program', description: 'Default laboratory program', active: true });
  const mgDl = await upsertBy(uomRepo, 'code', { code: 'UOM-MGDL', name: 'mg/dL', description: 'Milligrams per deciliter', active: true });
  const serum = await sampleTypeRepo.findOneOrFail({ where: { key: 'Serum' } });
  const defaultTest = await upsertBy(testRepo, 'code', {
    code: 'TST-HGB',
    name: 'Hemoglobin',
    description: 'Default hemoglobin test definition',
    loinc,
    category: chemistry,
    methodology: 'Automated hematology analyzer',
    resultType: 'NUMERIC',
    sampleTypes: [serum],
    programs: [program],
    uom: mgDl,
    minValue: '0',
    maxValue: '30',
    criticalMin: '5',
    criticalMax: '20',
    turnaroundTimeMinutes: 60,
    testDurationMinutes: 15,
    active: true,
    reportable: true,
  });

  for (const [gender, minAge, maxAge, lowValue, highValue] of [
    [ReferenceRangeGender.DEFAULT, 0, 1, 10.5, 20.5],
    [ReferenceRangeGender.DEFAULT, 2, 12, 11.0, 15.5],
    [ReferenceRangeGender.MALE, 13, 120, 13.5, 17.5],
    [ReferenceRangeGender.FEMALE, 13, 120, 12.0, 15.5],
    [ReferenceRangeGender.DEFAULT, 121, 150, 11.0, 16.0],
  ] as const) {
    const exists = await rangeRepo.findOne({ where: { test: { id: defaultTest.id }, gender, minAge, maxAge } });
    if (!exists) {
      await rangeRepo.save(rangeRepo.create({ test: defaultTest, gender, minAge, maxAge, lowValue: String(lowValue), highValue: String(highValue), unit: mgDl, active: true, operator: OperatorEnum.BETWEEN }));
    }
  }

  const hierarchy = [
    ['ORGANISATION', 'Organisation', ['FACILITY']],
    ['FACILITY', 'Facility', ['DEPARTMENT']],
    ['DEPARTMENT', 'Department', ['CLINIC', 'WARD', 'ROOM']],
    ['CLINIC', 'Clinic', ['ROOM']],
    ['WARD', 'Ward', ['ROOM']],
    ['ROOM', 'Room', ['SHELF', 'FREEZER']],
    ['SHELF', 'Shelf', ['ROW']],
    ['FREEZER', 'Freezer', ['ROW']],
    ['ROW', 'Row', ['COLUMN']],
    ['COLUMN', 'Column', []],
  ] as const;
  const typeMap = new Map<string, LocationTypeDefinitionEntity>();
  for (const [code, name] of hierarchy) {
    typeMap.set(code, await upsertBy(locationTypeRepo, 'code', { code, name, description: name, allowChildren: false, active: true }));
  }
  for (const [code, , childCodes] of hierarchy) {
    const type = typeMap.get(code)!;
    type.allowedChildTypes = childCodes.map((childCode) => typeMap.get(childCode)!).filter(Boolean);
    type.allowChildren = type.allowedChildTypes.length > 0;
    await locationTypeRepo.save(type);
  }
  for (const key of ['protocol', 'host', 'port', 'serial_port', 'baud_rate', 'data_bits', 'stop_bits', 'parity', 'slave_id', 'temperature_register', 'humidity_register', 'temperature_scale', 'temperature_offset', 'humidity_scale', 'humidity_offset', 'target_temperature', 'warning_threshold', 'critical_threshold', 'polling_interval_seconds', 'active', 'last_updated', 'storage_device_id']) {
    const exists = await attrRepo.findOne({ where: { key, appliesToType: { id: typeMap.get('FREEZER')!.id } } });
    if (!exists) {
      await attrRepo.save(attrRepo.create({ key, name: key.replace(/_/g, ' '), dataType: key === 'active' ? LisAttributeDataType.BOOLEAN : LisAttributeDataType.TEXT, appliesToType: typeMap.get('FREEZER')!, active: true }));
    }
  }

  let parent: LocationEntity | null = null;
  for (const [code, name] of hierarchy) {
    parent = await upsertBy(locationRepo, 'reference', {
      name: `Default ${name}`,
      reference: `LOC-${code}`,
      type: typeMap.get(code)!,
      parent,
      active: true,
      storageAssignment: true,
    });
  }

  const eqaRepo = dataSource.getRepository(EqaProgramEntity);
  for (const [code, name, provider] of [
    ['CAP', 'College of American Pathologists', 'CAP'],
    ['RIQAS', 'Randox International Quality Assessment Scheme', 'Randox'],
    ['NEQAS', 'UK National External Quality Assessment Service', 'NEQAS'],
  ]) {
    await upsertBy(eqaRepo, 'code', { code, name, provider, description: name, active: true });
  }

  const qaChecklistRepo = dataSource.getRepository(QaChecklistItemEntity);
  for (const [code, name, category, required, sortOrder] of [
    ['QA-IDENTITY', 'Patient identity verified against requisition', 'ORDER_ENTRY', true, 10],
    ['QA-REQUISITION', 'Requisition complete and legible', 'ORDER_ENTRY', true, 20],
    ['QA-CLINICAL', 'Clinical information and diagnosis recorded', 'ORDER_ENTRY', false, 30],
    ['QA-CONSENT', 'Consent obtained (if required)', 'ORDER_ENTRY', false, 40],
    ['QA-TUBES', 'Correct tubes collected for ordered tests', 'SPECIMEN', true, 50],
    ['QA-QUANTITY', 'Sufficient sample quantity collected', 'SPECIMEN', true, 60],
    ['QA-CONDITIONS', 'Collection conditions met (fasting, timing, etc.)', 'SPECIMEN', false, 70],
    ['QA-LABEL', 'Labels printed and affixed to correct tubes', 'SPECIMEN', true, 80],
    ['QA-STORAGE', 'Storage locations assigned and tracked', 'SPECIMEN', false, 90],
    ['QA-ASSIGNED', 'All ordered tests assigned to samples', 'TEST', true, 100],
    ['QA-RESULT', 'Results entered for all assigned tests', 'RESULT_ENTRY', true, 110],
    ['QA-VALIDATION', 'Results validated by authorized reviewer', 'VALIDATION', true, 120],
  ]) {
    await upsertBy(qaChecklistRepo, 'code', { code, name, description: name, category, required, sortOrder, active: true });
  }

  await seedCsv(dataSource);
}

async function upsertBy(repo: any, key: string, payload: Record<string, any>): Promise<any> {
  const existing = await repo.findOne({ where: { [key]: payload[key] } });
  return existing ? repo.save({ ...existing, ...payload }) : repo.save(repo.create(payload));
}
