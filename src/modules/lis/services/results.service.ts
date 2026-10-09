import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { StatusesService } from './statuses.service';
import { StatusHistoryService } from './status-history.service';
import { ResultSignaturesService } from './result-signatures.service';
import { CreateResultDto } from '../dto/result.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class ResultsService extends BaseLisService<ResultEntity> {
  constructor(
    @InjectRepository(ResultEntity) repo: Repository<ResultEntity>,
    private readonly statuses: StatusesService,
    private readonly statusHistory: StatusHistoryService,
    private readonly signatures: ResultSignaturesService,
  ) {
    super(repo, 'results');
  }

  protected searchColumns(): string[] {
    return ['orderItemId', 'value'];
  }

  protected listFilters(query: Record<string, string>): Record<string, string> {
    const filters: Record<string, string> = {};
    if (query.status) {
      filters.status = query.status;
    }
    return filters;
  }

  protected relations(): string[] {
    return ['orderItem', 'unit', 'referenceRange', 'statusRef'];
  }

  async create(payload: CreateResultDto, tenant?: TenantContext): Promise<any> {
    const initialStatus = await this.statuses.findByCode('PENDING');
    const item = await this.repo.save(
      this.repo.create({
        orderItemId: payload.orderItemId,
        value: payload.value ?? null,
        unitId: payload.unitId ?? null,
        referenceRangeId: payload.referenceRangeId ?? null,
        enteredById: payload.enteredById ?? null,
        enteredDate: payload.enteredDate ?? new Date().toISOString().split('T')[0],
        validatedById: payload.validatedById ?? null,
        validatedDate: payload.validatedDate ?? null,
        notes: payload.notes ?? null,
        status: 'PENDING',
        statusId: initialStatus?.id ?? null,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    if (initialStatus) {
      await this.statusHistory.record('Result', item.id, initialStatus.id, null, payload.enteredById ?? null, 'Result entered');
    }
    return this.findOne(item.id);
  }

  async transitionStatus(id: string, toStatusId: string, tenant?: TenantContext, userId?: string, reason?: string): Promise<any> {
    const result = await this.findOne(id, tenant);
    if (!result) {
      throw new BadRequestException('Result not found');
    }
    const toStatus = await this.statuses.findOne(toStatusId);
    const fromCode = result.status;
    const toCode = toStatus.code;
    if (!this.statuses.validateTransition('RESULT', fromCode, toCode)) {
      throw new BadRequestException(`Invalid transition from "${fromCode}" to "${toCode}"`);
    }
    if (toCode === 'TECHNICAL_REVIEW') {
      const hasTechSig = await this.signatures.hasTechnicalSignature(id);
      if (!hasTechSig) {
        throw new BadRequestException('A technical signature is required before moving to Technical Review');
      }
    }
    if (toCode === 'FINALIZED') {
      const sigStatus = await this.signatures.getSignatureStatus(id);
      if (!sigStatus.technical) {
        throw new BadRequestException('A technical signature is required before finalizing');
      }
    }
    result.status = toCode;
    result.statusId = toStatusId;
    if (toCode === 'TECHNICAL_REVIEW') result.validatedDate = new Date().toISOString().split('T')[0];
    if (toCode === 'FINALIZED') result.validatedDate = new Date().toISOString().split('T')[0];
    await this.repo.save(result);
    await this.statusHistory.record('Result', id, toStatusId, result.statusId, userId ?? null, reason ?? null);
    return this.findOne(id, tenant);
  }
}
