import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

function makeQbResult(row: unknown) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(row),
    getManyAndCount: jest.fn().mockResolvedValue([[row], 1]),
  };
}

describe('OrdersService (EMR intake)', () => {
  let service: OrdersService;
  let repo: any;
  let orderItemRepo: any;
  let sampleRepo: any;
  let testDefinitionRepo: any;
  let loincRepo: any;
  let codes: any;
  let statuses: any;
  let statusHistory: any;

  const order = {
    id: 'order-1',
    orderNumber: 'EMRORD-1001',
    patientNumber: null,
    referenceCode: null,
    items: [],
    samples: [],
  };

  beforeEach(() => {
    repo = {
      create: jest.fn().mockReturnValue({ ...order }),
      save: jest.fn().mockImplementation(async (entity: any) => ({ ...order, ...entity })),
      createQueryBuilder: jest.fn(() => makeQbResult({ ...order, items: [], samples: [] })),
    };
    orderItemRepo = {
      create: jest.fn().mockImplementation((data: any) => ({ ...data })),
      save: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
    };
    sampleRepo = { create: jest.fn(), save: jest.fn().mockResolvedValue([]), find: jest.fn().mockResolvedValue([]) };
    testDefinitionRepo = { findOne: jest.fn().mockResolvedValue(null) };
    loincRepo = { findOne: jest.fn().mockResolvedValue(null) };
    codes = { generate: jest.fn() };
    statuses = {
      findByCode: jest.fn().mockResolvedValue({ id: 'status-entered', code: 'ENTERED' }),
      validateTransition: jest.fn().mockReturnValue(true),
    };
    statusHistory = { record: jest.fn().mockResolvedValue({}) };

    service = new OrdersService(
      repo,
      orderItemRepo,
      sampleRepo,
      testDefinitionRepo,
      loincRepo,
      codes,
      statuses,
      statusHistory,
    );
  });

  it('persists patientNumber and referenceCode from the EMR payload', async () => {
    await service.create(
      {
        source: 'emr-encounter-request',
        patientId: 'patient-uuid',
        patientNumber: 'PAT-77',
        patientName: 'Ada Obi',
        internalReference: 'REQ-1001',
        referenceCode: 'REQ-1001',
        items: [{ testDefinitionId: '123e4567-e89b-12d3-a456-426614174000' }],
      } as any,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientNumber: 'PAT-77',
        referenceCode: 'REQ-1001',
      }),
    );
  });

  it('falls back to internalReference when no referenceCode is sent', async () => {
    await service.create(
      {
        patientId: 'patient-uuid',
        patientName: 'Ada Obi',
        internalReference: 'REQ-2002',
        items: [{ testDefinitionId: '123e4567-e89b-12d3-a456-426614174000' }],
      } as any,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ referenceCode: 'REQ-2002' }),
    );
  });

  it('keeps a raw uuid testDefinitionId untouched', async () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    await service.create({
      patientId: 'p',
      patientName: 'Ada Obi',
      items: [{ testDefinitionId: uuid }],
    } as any);

    expect(testDefinitionRepo.findOne).not.toHaveBeenCalled();
    expect(orderItemRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ testDefinitionId: uuid, referenceCode: null }),
      ]),
    );
  });

  it('resolves a test definition code to its uuid', async () => {
    testDefinitionRepo.findOne.mockImplementation(async (options: any) => {
      if (options?.where?.code === 'CBC') return { id: 'td-uuid-1', code: 'CBC' };
      return null;
    });

    await service.create({
      patientId: 'p',
      patientName: 'Ada Obi',
      items: [{ testDefinitionId: 'CBC', referenceCode: 'LOINC_TEST:58410-2' }],
    } as any);

    expect(testDefinitionRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ code: 'CBC' }) }),
    );
    expect(orderItemRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ testDefinitionId: 'td-uuid-1', referenceCode: 'LOINC_TEST:58410-2' }),
      ]),
    );
  });

  it('resolves a LOINC code via the test definition linked to it', async () => {
    testDefinitionRepo.findOne.mockImplementation(async (options: any) => {
      if (options?.where?.loinc) return { id: 'td-via-loinc', code: 'CBC' };
      return null;
    });
    loincRepo.findOne.mockResolvedValue({ id: 'loinc-1', code: '58410-2' });

    await service.create({
      patientId: 'p',
      patientName: 'Ada Obi',
      items: [{ testDefinitionId: '58410-2' }],
    } as any);

    expect(loincRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ code: '58410-2' }) }),
    );
    expect(orderItemRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ testDefinitionId: 'td-via-loinc' }),
      ]),
    );
  });

  it('rejects an unknown test code instead of writing a dangling order item', async () => {
    testDefinitionRepo.findOne.mockResolvedValue(null);
    loincRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        patientId: 'p',
        patientName: 'Ada Obi',
        items: [{ testDefinitionId: 'NOT-A-CODE' }],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderItemRepo.save).not.toHaveBeenCalled();
  });
});
