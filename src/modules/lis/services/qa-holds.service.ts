import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaHoldEventEntity } from '../entities/qa-hold-event.entity';
import { ResultsService } from './results.service';
import { StatusHistoryService } from './status-history.service';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class QaHoldsService {
  constructor(
    @InjectRepository(QaHoldEventEntity)
    private readonly repo: Repository<QaHoldEventEntity>,
    private readonly results: ResultsService,
    private readonly statusHistory: StatusHistoryService,
  ) {}

  /**
   * Place a result on QA hold. Requires reason + reviewer.
   * Stores the current status as previousStatus, then sets result status to QA_HOLD.
   */
  async holdResult(
    resultId: string,
    reason: string,
    reviewerId: string,
    tenant?: TenantContext,
  ): Promise<QaHoldEventEntity> {
    const result = await this.results.findOne(resultId, tenant);
    if (!result) throw new BadRequestException('Result not found');

    if (result.status === 'QA_HOLD') {
      throw new BadRequestException('Result is already on QA hold');
    }

    if (result.status !== 'PENDING' && result.status !== 'TECHNICAL_REVIEW') {
      throw new BadRequestException(
        `Cannot hold a result with status "${result.status}". Only PENDING or TECHNICAL_REVIEW results can be held.`,
      );
    }

    const previousStatus = result.status;

    await this.results.update(resultId, { status: 'QA_HOLD' }, tenant);

    await this.statusHistory.record(
      'Result',
      resultId,
      'QA_HOLD',
      null,
      reviewerId,
      `QA HOLD: ${reason}`,
      tenant,
    );

    const event = this.repo.create({
      resultId,
      action: 'HOLD',
      reason,
      reviewerId,
      previousStatus,
      timestamp: new Date(),
      organizationId: tenant?.organizationId ?? null,
      locationId: tenant?.locationId ?? null,
    });
    return this.repo.save(event);
  }

  /**
   * Release a result from QA hold back to its previous status.
   */
  async releaseResult(
    resultId: string,
    reason: string | null,
    reviewerId: string,
    tenant?: TenantContext,
  ): Promise<QaHoldEventEntity> {
    const result = await this.results.findOne(resultId, tenant);
    if (!result) throw new BadRequestException('Result not found');

    if (result.status !== 'QA_HOLD') {
      throw new BadRequestException('Result is not on QA hold');
    }

    const lastHold = await this.repo.findOne({
      where: { resultId, action: 'HOLD' },
      order: { timestamp: 'DESC' },
    });

    if (!lastHold || !lastHold.previousStatus) {
      throw new BadRequestException('Cannot release: no previous status recorded');
    }

    const restoredStatus = lastHold.previousStatus;

    await this.results.update(resultId, { status: restoredStatus }, tenant);

    await this.statusHistory.record(
      'Result',
      resultId,
      'QA_RELEASE',
      null,
      reviewerId,
      `QA RELEASE: ${reason ?? 'Released from QA hold'}`,
      tenant,
    );

    const event = this.repo.create({
      resultId,
      action: 'RELEASE',
      reason: reason ?? null,
      reviewerId,
      previousStatus: restoredStatus,
      restoredStatus,
      timestamp: new Date(),
      organizationId: tenant?.organizationId ?? null,
      locationId: tenant?.locationId ?? null,
    });
    return this.repo.save(event);
  }

  /**
   * Get QA hold event history for a result.
   */
  async getHoldHistory(
    resultId: string,
    tenant?: TenantContext,
  ): Promise<QaHoldEventEntity[]> {
    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.result_id = :resultId', { resultId })
      .andWhere('e.deleted_at IS NULL')
      .orderBy('e.timestamp', 'DESC');

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(e.organization_id = :orgId OR e.organization_id IS NULL)', {
        orgId: tenant.organizationId,
      });
      if (tenant.locationId) {
        qb.andWhere('(e.location_id = :locId OR e.location_id IS NULL)', {
          locId: tenant.locationId,
        });
      }
    }

    return qb.getMany();
  }

  /**
   * List all results currently on QA hold.
   */
  async getHeldResults(tenant?: TenantContext): Promise<any[]> {
    const result = await this.results.list(
      { status: 'QA_HOLD', limit: '200' } as any,
      tenant,
    );
    return result.data;
  }
}