import { BadRequestException } from '@nestjs/common';
import { ResultAmendmentsService } from './result-amendments.service';

function mockRepo(overrides = {}) {
  const store: any[] = [];
  return {
    create: jest.fn().mockImplementation((data: any) => data ?? {}),
    save: jest.fn().mockImplementation((data: any) => {
      const saved = { ...data, id: data?.id ?? `save-${store.length + 1}` };
      store.push(saved);
      return Promise.resolve(saved);
    }),
    findOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
    ...overrides,
  };
}

function mockResultsService() {
  return {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  };
}

function mockStatusHistory() {
  return {
    record: jest.fn().mockResolvedValue({}),
  };
}

describe('ResultAmendmentsService', () => {
  let service: ResultAmendmentsService;
  let amendmentRepo: ReturnType<typeof mockRepo>;
  let resultRepo: ReturnType<typeof mockRepo>;
  let results: ReturnType<typeof mockResultsService>;
  let statusHistory: ReturnType<typeof mockStatusHistory>;

  beforeEach(() => {
    amendmentRepo = mockRepo();
    resultRepo = mockRepo({ update: jest.fn().mockResolvedValue({ affected: 1 }) });
    results = mockResultsService();
    statusHistory = mockStatusHistory();
    service = new ResultAmendmentsService(
      amendmentRepo as any,
      resultRepo as any,
      results as any,
      statusHistory as any,
    );
  });

  describe('amend', () => {
    const validDto = {
      reason: 'Incorrect value entered',
      correctedValue: '7.5',
      correctedById: 'user-1',
    };

    it('should throw when result not found', async () => {
      results.findOne.mockRejectedValue(new BadRequestException('Record not found'));
      await expect(service.amend('bad-id', validDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw when result status is PENDING', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'PENDING' });
      await expect(service.amend('r-1', validDto)).rejects.toThrow('Cannot amend a result with status');
    });

    it('should throw when result status is CANCELLED', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'CANCELLED' });
      await expect(service.amend('r-1', validDto)).rejects.toThrow('Cannot amend a result with status');
    });

    it('should amend a FINALIZED result successfully', async () => {
      const originalResult = {
        id: 'r-1',
        orderItemId: 'oi-1',
        value: '5.0',
        unitId: 'u-1',
        referenceRangeId: 'rr-1',
        status: 'FINALIZED',
        amendmentNumber: 0,
        notes: 'Initial result',
        organizationId: 'org-1',
        locationId: null,
        supersededById: null,
      };
      results.findOne.mockResolvedValue(originalResult);
      resultRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: 'new-r-2', ...data }),
      );
      results.findOne.mockResolvedValueOnce(originalResult) // first call
        .mockResolvedValueOnce({ ...originalResult, id: 'new-r-2', value: '7.5', amendmentNumber: 1 }); // after findOne for new result

      const result = await service.amend('r-1', validDto);

      expect(result.amendment.reason).toBe('Incorrect value entered');
      expect(result.amendment.previousValue).toBe('5.0');
      expect(result.amendment.correctedValue).toBe('7.5');
      expect(result.amendment.amendmentNumber).toBe(1);
      expect(resultRepo.update).toHaveBeenCalledWith('r-1', { isLatest: false });
      expect(statusHistory.record).toHaveBeenCalledWith('Result', 'new-r-2', 'PENDING', null, 'user-1', 'Amendment #1: Incorrect value entered', undefined);
    });

    it('should preserve original value when correctedValue is not provided', async () => {
      const originalResult = {
        id: 'r-1', orderItemId: 'oi-1', value: '5.0', status: 'FINALIZED',
        amendmentNumber: 0, notes: null, organizationId: 'org-1', locationId: null,
        unitId: null, referenceRangeId: null, supersededById: null,
      };
      results.findOne.mockResolvedValue(originalResult);
      resultRepo.save.mockImplementation((data: any) =>
        Promise.resolve({ id: 'new-r-2', ...data }),
      );
      results.findOne.mockResolvedValueOnce(originalResult)
        .mockResolvedValueOnce({ ...originalResult, id: 'new-r-2', amendmentNumber: 1 });

      const result = await service.amend('r-1', {
        reason: 'Updated notes',
        correctedValue: undefined,
        correctedById: 'user-1',
      });

      // The value should be preserved from the original (no correctedValue = copy original)
      expect(result.amendment.correctedValue).toBe('5.0');
    });
  });

  describe('getAmendmentHistory', () => {
    it('should return amendments ordered by amendment number', async () => {
      const amendments = [
        { id: 'a-1', amendmentNumber: 1, reason: 'First correction' },
        { id: 'a-2', amendmentNumber: 2, reason: 'Second correction' },
      ];
      amendmentRepo.createQueryBuilder().getMany.mockResolvedValue(amendments);

      const result = await service.getAmendmentHistory('r-1');
      expect(result).toHaveLength(2);
      expect(result[0].amendmentNumber).toBe(1);
    });
  });
});