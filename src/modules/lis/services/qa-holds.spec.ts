import { BadRequestException } from '@nestjs/common';
import { QaHoldsService } from './qa-holds.service';

function mockRepo() {
  return {
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue({ id: 'event-1', action: 'HOLD', timestamp: new Date() }),
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };
}

function mockResultsService() {
  return {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  };
}

function mockStatusHistory() {
  return {
    record: jest.fn().mockResolvedValue({}),
  };
}

describe('QaHoldsService', () => {
  let service: QaHoldsService;
  let repo: ReturnType<typeof mockRepo>;
  let results: ReturnType<typeof mockResultsService>;
  let statusHistory: ReturnType<typeof mockStatusHistory>;

  beforeEach(() => {
    repo = mockRepo();
    results = mockResultsService();
    statusHistory = mockStatusHistory();
    service = new QaHoldsService(repo as any, results as any, statusHistory as any);
  });

  describe('holdResult', () => {
    it('should throw when result not found', async () => {
      results.findOne.mockRejectedValue(new BadRequestException('Record not found'));
      await expect(
        service.holdResult('bad-id', 'reason', 'reviewer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when result status is not PENDING or TECHNICAL_REVIEW', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'FINALIZED' });
      await expect(
        service.holdResult('r-1', 'reason', 'reviewer-1'),
      ).rejects.toThrow('Cannot hold a result with status');
    });

    it('should throw when result is already on QA_HOLD', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'QA_HOLD' });
      await expect(
        service.holdResult('r-1', 'reason', 'reviewer-1'),
      ).rejects.toThrow('already on QA hold');
    });

    it('should hold a PENDING result successfully', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'PENDING' });
      results.update.mockResolvedValue({ id: 'r-1', status: 'QA_HOLD' });
      repo.save.mockResolvedValue({
        id: 'event-1',
        resultId: 'r-1',
        action: 'HOLD',
        reason: 'QA check needed',
        reviewerId: 'reviewer-1',
        previousStatus: 'PENDING',
      });

      const event = await service.holdResult('r-1', 'QA check needed', 'reviewer-1');
      expect(event.action).toBe('HOLD');
      expect(event.previousStatus).toBe('PENDING');
      expect(results.update).toHaveBeenCalledWith('r-1', { status: 'QA_HOLD' }, undefined);
      expect(statusHistory.record).toHaveBeenCalledWith('Result', 'r-1', 'QA_HOLD', null, 'reviewer-1', 'QA HOLD: QA check needed', undefined);
    });
  });

  describe('releaseResult', () => {
    it('should throw when result not on QA_HOLD', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'PENDING' });
      await expect(
        service.releaseResult('r-1', null, 'reviewer-1'),
      ).rejects.toThrow('not on QA hold');
    });

    it('should throw when no previous status recorded', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'QA_HOLD' });
      repo.findOne.mockResolvedValue({
        id: 'event-1',
        action: 'HOLD',
        previousStatus: null,
      });

      await expect(
        service.releaseResult('r-1', null, 'reviewer-1'),
      ).rejects.toThrow('no previous status recorded');
    });

    it('should release a QA_HOLD result back to previous status', async () => {
      results.findOne.mockResolvedValue({ id: 'r-1', status: 'QA_HOLD' });
      repo.findOne.mockResolvedValue({
        id: 'event-1',
        action: 'HOLD',
        previousStatus: 'PENDING',
      });
      repo.save.mockResolvedValue({
        id: 'event-2',
        resultId: 'r-1',
        action: 'RELEASE',
        reason: null,
        reviewerId: 'reviewer-1',
        previousStatus: 'PENDING',
        restoredStatus: 'PENDING',
      });

      const event = await service.releaseResult('r-1', null, 'reviewer-1');
      expect(event.action).toBe('RELEASE');
      expect(event.restoredStatus).toBe('PENDING');
      expect(results.update).toHaveBeenCalledWith('r-1', { status: 'PENDING' }, undefined);
      expect(statusHistory.record).toHaveBeenCalledWith(
        'Result', 'r-1', 'QA_RELEASE', null, 'reviewer-1', 'QA RELEASE: Released from QA hold', undefined,
      );
    });
  });

  describe('getHeldResults', () => {
    it('should return results with status QA_HOLD', async () => {
      results.list.mockResolvedValue({ data: [{ id: 'r-1', status: 'QA_HOLD' }], total: 1 });
      const data = await service.getHeldResults();
      expect(data).toHaveLength(1);
      expect(data[0].status).toBe('QA_HOLD');
    });
  });
});