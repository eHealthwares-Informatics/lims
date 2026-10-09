import { ResultsService } from './results.service';
import { TatService } from './tat.service';
import {
  TatPriority,
  actualMinutesBetween,
  computeResultTat,
  resolvePriorityCode,
  summarizeTat,
  targetMinutesFor,
} from './tat-calculator';

describe('TAT calculator', () => {
  describe('resolvePriorityCode', () => {
    it('maps STAT, URGENT, EMERGENCY and routine codes to TAT priorities', () => {
      expect(resolvePriorityCode('STAT')).toBe(TatPriority.STAT);
      expect(resolvePriorityCode('stat')).toBe(TatPriority.STAT);
      expect(resolvePriorityCode('URGENT')).toBe(TatPriority.STAT);
      expect(resolvePriorityCode('EMERGENCY')).toBe(TatPriority.EMERGENCY);
      expect(resolvePriorityCode('ROUTINE')).toBe(TatPriority.ROUTINE);
      expect(resolvePriorityCode('NORMAL')).toBe(TatPriority.ROUTINE);
    });

    it('falls back to the priority name when the code is unknown', () => {
      expect(resolvePriorityCode('P1', 'Emergency')).toBe(TatPriority.EMERGENCY);
      expect(resolvePriorityCode('P2', 'STAT request')).toBe(TatPriority.STAT);
    });

    it('defaults to ROUTINE for unknown/missing priorities', () => {
      expect(resolvePriorityCode(null, null)).toBe(TatPriority.ROUTINE);
      expect(resolvePriorityCode('WEIRD')).toBe(TatPriority.ROUTINE);
    });
  });

  describe('targetMinutesFor', () => {
    const test = { tatRoutineMinutes: 240, tatStatMinutes: 60, tatEmergencyMinutes: 30 };

    it('returns the target configured for the resolved priority', () => {
      expect(targetMinutesFor(test, TatPriority.ROUTINE)).toBe(240);
      expect(targetMinutesFor(test, TatPriority.STAT)).toBe(60);
      expect(targetMinutesFor(test, TatPriority.EMERGENCY)).toBe(30);
    });

    it('returns null when no test definition or no target is configured', () => {
      expect(targetMinutesFor(null, TatPriority.STAT)).toBeNull();
      expect(targetMinutesFor({ ...test, tatStatMinutes: null }, TatPriority.STAT)).toBeNull();
    });
  });

  describe('actualMinutesBetween', () => {
    it('returns whole elapsed minutes', () => {
      expect(
        actualMinutesBetween('2026-10-01T10:00:00Z', '2026-10-01T11:30:00Z'),
      ).toBe(90);
    });

    it('returns null when a timestamp is missing or the release precedes entry', () => {
      expect(actualMinutesBetween(null, '2026-10-01T11:30:00Z')).toBeNull();
      expect(actualMinutesBetween('2026-10-01T10:00:00Z', null)).toBeNull();
      expect(
        actualMinutesBetween('2026-10-01T12:00:00Z', '2026-10-01T11:00:00Z'),
      ).toBeNull();
    });
  });

  describe('summarizeTat', () => {
    const test = { tatRoutineMinutes: 120, tatStatMinutes: 60, tatEmergencyMinutes: 30 };

    it('flags a breach when actual exceeds the target and reports the overrun', () => {
      const summary = summarizeTat({
        test,
        priorityCode: 'STAT',
        startedAt: '2026-10-01T10:00:00Z',
        releasedAt: '2026-10-01T11:45:00Z',
      });
      expect(summary.priority).toBe(TatPriority.STAT);
      expect(summary.targetMinutes).toBe(60);
      expect(summary.actualMinutes).toBe(105);
      expect(summary.breached).toBe(true);
      expect(summary.breachedByMinutes).toBe(45);
    });

    it('is not breached when actual is within target', () => {
      const summary = summarizeTat({
        test,
        priorityCode: 'STAT',
        startedAt: '2026-10-01T10:00:00Z',
        releasedAt: '2026-10-01T10:30:00Z',
      });
      expect(summary.breached).toBe(false);
      expect(summary.breachedByMinutes).toBe(0);
    });

    it('is not breached when no target is configured', () => {
      const summary = summarizeTat({
        test: null,
        startedAt: '2026-10-01T10:00:00Z',
        releasedAt: '2026-10-01T10:30:00Z',
      });
      expect(summary.targetMinutes).toBeNull();
      expect(summary.actualMinutes).toBe(30);
      expect(summary.breached).toBe(false);
      expect(summary.breachedByMinutes).toBeNull();
    });
  });

  describe('computeResultTat', () => {
    it('uses order entry (createdAt) → result release (validatedDate)', () => {
      const summary = computeResultTat({
        id: 'r-1',
        validatedDate: '2026-10-01T11:00:00Z',
        updatedAt: '2026-10-02T00:00:00Z',
        orderItem: {
          testDefinition: { tatRoutineMinutes: 45, tatStatMinutes: 20, tatEmergencyMinutes: 10 },
          order: {
            orderNumber: 'ORD-1',
            createdAt: '2026-10-01T10:00:00Z',
            priority: { code: 'EMERGENCY', name: 'Emergency' },
          },
        },
      });

      expect(summary.priority).toBe(TatPriority.EMERGENCY);
      expect(summary.targetMinutes).toBe(10);
      expect(summary.actualMinutes).toBe(60);
      expect(summary.breached).toBe(true);
    });

    it('falls back to updatedAt when the result has not been released', () => {
      const summary = computeResultTat({
        id: 'r-2',
        validatedDate: null,
        updatedAt: '2026-10-01T10:20:00Z',
        orderItem: {
          testDefinition: { tatRoutineMinutes: 45, tatStatMinutes: 20, tatEmergencyMinutes: 10 },
          order: { createdAt: '2026-10-01T10:00:00Z', priority: { code: 'ROUTINE', name: 'Routine' } },
        },
      });

      expect(summary.actualMinutes).toBe(20);
      expect(summary.breached).toBe(false);
    });

    it('returns a null actual when the order has no entry timestamp', () => {
      const summary = computeResultTat({
        id: 'r-3',
        validatedDate: '2026-10-01T11:00:00Z',
        orderItem: {
          testDefinition: { tatRoutineMinutes: 45, tatStatMinutes: null, tatEmergencyMinutes: null },
          order: { createdAt: null, requestedDate: null, priority: null },
        },
      });

      expect(summary.actualMinutes).toBeNull();
      expect(summary.breached).toBe(false);
    });
  });
});

describe('TatService', () => {
  function mockResultsService() {
    return {
      findOne: jest.fn(),
      list: jest.fn(),
    };
  }

  let service: TatService;
  let results: ReturnType<typeof mockResultsService>;

  beforeEach(() => {
    results = mockResultsService();
    service = new TatService(results as any);
  });

  it('getResultTat returns the row with its TAT summary', async () => {
    results.findOne.mockResolvedValue({
      id: 'r-1',
      orderItemId: 'oi-1',
      status: 'FINALIZED',
      value: '12.5',
      validatedDate: '2026-10-01T11:00:00Z',
      orderItem: {
        id: 'oi-1',
        testDefinition: { tatRoutineMinutes: 120, tatStatMinutes: 60, tatEmergencyMinutes: 30 },
        order: { orderNumber: 'ORD-1', createdAt: '2026-10-01T10:00:00Z', priority: { code: 'ROUTINE', name: 'Routine' } },
      },
    });

    const row = await service.getResultTat('r-1');
    expect(row.orderNumber).toBe('ORD-1');
    expect(row.tat.actualMinutes).toBe(60);
    expect(row.tat.targetMinutes).toBe(120);
    expect(row.tat.breached).toBe(false);
    expect(results.findOne).toHaveBeenCalledWith('r-1', undefined);
  });

  it('report aggregates within-target, breached and awaiting-release results', async () => {
    results.list.mockResolvedValue({
      data: [
        // within target
        {
          id: 'r-1',
          status: 'FINALIZED',
          validatedDate: '2026-10-01T10:30:00Z',
          orderItem: { id: 'oi-1', testDefinition: { tatRoutineMinutes: 60, tatStatMinutes: null, tatEmergencyMinutes: null }, order: { orderNumber: 'ORD-1', createdAt: '2026-10-01T10:00:00Z', priority: { code: 'ROUTINE', name: 'Routine' } } },
        },
        // breached
        {
          id: 'r-2',
          status: 'FINALIZED',
          validatedDate: '2026-10-01T12:30:00Z',
          orderItem: { id: 'oi-2', testDefinition: { tatRoutineMinutes: 60, tatStatMinutes: null, tatEmergencyMinutes: null }, order: { orderNumber: 'ORD-2', createdAt: '2026-10-01T10:00:00Z', priority: { code: 'ROUTINE', name: 'Routine' } } },
        },
        // awaiting release (no validatedDate → updatedAt fallback still yields an actual)
        {
          id: 'r-3',
          status: 'PENDING',
          validatedDate: null,
          updatedAt: '2026-10-01T10:10:00Z',
          orderItem: { id: 'oi-3', testDefinition: { tatRoutineMinutes: 60, tatStatMinutes: null, tatEmergencyMinutes: null }, order: { orderNumber: 'ORD-3', createdAt: '2026-10-01T10:00:00Z', priority: { code: 'ROUTINE', name: 'Routine' } } },
        },
      ],
      total: 3,
    });

    const report = await service.report();
    expect(report.data).toHaveLength(3);
    expect(report.summary).toMatchObject({
      total: 3,
      released: 3,
      awaitingRelease: 0,
      withinTarget: 2,
      breached: 1,
      noTarget: 0,
    });
    expect(report.summary.averageMinutes).toBe(63);
    expect(report.data[1].tat.breached).toBe(true);
  });

  it('report counts results with no configured target separately', async () => {
    results.list.mockResolvedValue({
      data: [
        {
          id: 'r-1',
          status: 'FINALIZED',
          validatedDate: '2026-10-01T10:30:00Z',
          orderItem: { id: 'oi-1', testDefinition: { tatRoutineMinutes: null, tatStatMinutes: null, tatEmergencyMinutes: null }, order: { createdAt: '2026-10-01T10:00:00Z', priority: null } },
        },
      ],
      total: 1,
    });

    const report = await service.report();
    expect(report.summary.noTarget).toBe(1);
    expect(report.summary.breached).toBe(0);
    expect(report.summary.withinTarget).toBe(0);
  });
});

describe('ResultsService serialization', () => {
  function buildService() {
    const repo = { createQueryBuilder: jest.fn() } as any;
    const statuses = {} as any;
    const statusHistory = {} as any;
    const signatures = {} as any;
    return new ResultsService(repo, statuses, statusHistory, signatures);
  }

  it('attaches a tat summary to result rows', () => {
    const service = buildService();
    const serialized = (service as any).serialize({
      id: 'r-1',
      validatedDate: '2026-10-01T11:00:00Z',
      orderItem: {
        testDefinition: { tatRoutineMinutes: 120, tatStatMinutes: null, tatEmergencyMinutes: null },
        order: { createdAt: '2026-10-01T10:00:00Z', priority: { code: 'ROUTINE', name: 'Routine' } },
      },
    });

    expect(serialized.tat).toMatchObject({
      priority: 'ROUTINE',
      actualMinutes: 60,
      targetMinutes: 120,
      breached: false,
    });
  });
});
