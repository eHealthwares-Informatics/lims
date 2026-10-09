import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultAmendmentEntity, ResultEntity } from '../entities';
import { ResultsService } from './results.service';
import { StatusHistoryService } from './status-history.service';
import { TenantContext } from '../../../common/tenant-context';
import { AmendResultDto } from '../dto/result-amendment.dto';

@Injectable()
export class ResultAmendmentsService {
  constructor(
    @InjectRepository(ResultAmendmentEntity)
    private readonly repo: Repository<ResultAmendmentEntity>,
    @InjectRepository(ResultEntity)
    private readonly resultRepo: Repository<ResultEntity>,
    private readonly results: ResultsService,
    private readonly statusHistory: StatusHistoryService,
  ) {}

  /**
   * Amend a result: creates a new result record superseding the original,
   * logs the amendment event, resets status to PENDING for re-validation.
   */
  async amend(
    resultId: string,
    dto: AmendResultDto,
    tenant?: TenantContext,
  ): Promise<{ amendment: ResultAmendmentEntity; newResult: any }> {
    const original = await this.results.findOne(resultId, tenant);
    if (!original) {
      throw new BadRequestException('Result not found');
    }

    // Only allow amendment of FINALIZED or TECHNICAL_REVIEW results
    if (original.status !== 'FINALIZED' && original.status !== 'TECHNICAL_REVIEW') {
      throw new BadRequestException(
        `Cannot amend a result with status "${original.status}". Only FINALIZED or TECHNICAL_REVIEW results can be amended.`,
      );
    }

    // Determine next amendment number
    const amendmentNumber = (original.amendmentNumber ?? 0) + 1;

    // Mark original as superseded
    await this.resultRepo.update(original.id, {
      isLatest: false,
    });

    // Create new result record as a clone with corrected value
    const newResultData = {
      orderItemId: original.orderItemId,
      value: dto.correctedValue ?? original.value,
      unitId: original.unitId,
      referenceRangeId: original.referenceRangeId,
      status: 'PENDING',
      statusId: null,
      enteredById: dto.correctedById,
      enteredDate: new Date().toISOString().split('T')[0],
      notes: original.notes
        ? `${original.notes}\n[Amend #${amendmentNumber}]: ${dto.reason}`
        : `[Amend #${amendmentNumber}]: ${dto.reason}`,
      supersededById: original.id,
      isLatest: true,
      amendmentNumber,
      organizationId: original.organizationId,
      locationId: original.locationId,
    };

    const saved = await this.resultRepo.save(
      this.resultRepo.create(newResultData),
    );

    // Record status history on the new result
    await this.statusHistory.record(
      'Result',
      saved.id,
      'PENDING',
      null,
      dto.correctedById,
      `Amendment #${amendmentNumber}: ${dto.reason}`,
      tenant,
    );

    // Create amendment record
    const amendment = await this.repo.save(
      this.repo.create({
        resultId: original.id,
        amendmentNumber,
        reason: dto.reason,
        previousValue: original.value,
        correctedValue: dto.correctedValue ?? original.value,
        correctedById: dto.correctedById,
        correctedAt: new Date(),
        previousStatus: original.status,
        newStatus: 'PENDING',
        supersededResultId: saved.id,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );

    const newResult = await this.results.findOne(saved.id, tenant);
    return { amendment, newResult };
  }

  /**
   * Get amendment history for a result (both as original and superseded).
   */
  async getAmendmentHistory(
    resultId: string,
    tenant?: TenantContext,
  ): Promise<ResultAmendmentEntity[]> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.result_id = :resultId', { resultId })
      .andWhere('a.deleted_at IS NULL')
      .orderBy('a.amendment_number', 'ASC');

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(a.organization_id = :orgId OR a.organization_id IS NULL)', {
        orgId: tenant.organizationId,
      });
    }

    return qb.getMany();
  }

  /**
   * Get the full amendment timeline for a chain of results (original → amendments).
   * Returns all amendments plus the original result info.
   */
  async getFullTimeline(
    resultId: string,
    tenant?: TenantContext,
  ): Promise<{
    original: any;
    amendments: ResultAmendmentEntity[];
    supersededBy: any | null;
  }> {
    const result = await this.results.findOne(resultId, tenant);
    if (!result) throw new BadRequestException('Result not found');

    // Get amendments for this result
    const amendments = await this.getAmendmentHistory(resultId, tenant);

    // If this result is superseded by another, fetch that too
    let supersededBy = null;
    if (result.supersededById) {
      supersededBy = await this.results.findOne(result.supersededById, tenant).catch(() => null);
    }

    // If this result supersedes another, fetch the original
    let original = result;
    if (result.supersededById) {
      const parent = await this.results.findOne(result.supersededById, tenant).catch(() => null);
      if (parent) {
        original = parent;
      }
    }

    return { original, amendments, supersededBy };
  }
}