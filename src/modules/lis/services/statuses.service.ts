import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateStatusDto } from '../dto/status.dto';
import { TenantContext } from '../../../common/tenant-context';

const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDER: ['ENTERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  SAMPLE: ['COLLECTED', 'RECEIVED', 'IN_PROGRESS', 'DISPOSED', 'REJECTED'],
  RESULT: ['PENDING', 'TECHNICAL_REVIEW', 'FINALIZED', 'CANCELLED'],
};

type Domain = 'ORDER' | 'SAMPLE' | 'RESULT';

const ORDER_SEQUENCE: Record<string, number> = { ENTERED: 0, IN_PROGRESS: 1, COMPLETED: 2, CANCELLED: 9 };
const SAMPLE_SEQUENCE: Record<string, number> = { COLLECTED: 0, RECEIVED: 1, IN_PROGRESS: 2, DISPOSED: 3, REJECTED: 9 };
const RESULT_SEQUENCE: Record<string, number> = { PENDING: 0, TECHNICAL_REVIEW: 1, FINALIZED: 2, CANCELLED: 9 };

const SEQUENCES: Record<Domain, Record<string, number>> = {
  ORDER: ORDER_SEQUENCE,
  SAMPLE: SAMPLE_SEQUENCE,
  RESULT: RESULT_SEQUENCE,
};

@Injectable()
export class StatusesService extends BaseLisService<StatusEntity> {
  constructor(
    @InjectRepository(StatusEntity) repo: Repository<StatusEntity>,
  ) {
    super(repo, 'statuses');
  }

  protected searchColumns(): string[] {
    return ['name', 'code', 'domain'];
  }

  async create(payload: CreateStatusDto, tenant?: TenantContext): Promise<any> {
    if (!VALID_TRANSITIONS[payload.domain]?.includes(payload.code)) {
      throw new BadRequestException(`Invalid code "${payload.code}" for domain "${payload.domain}". Allowed: ${VALID_TRANSITIONS[payload.domain]?.join(', ') || 'none'}`);
    }
    const duplicate = await this.repo.findOne({ where: { code: payload.code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Status code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code: payload.code,
        name: payload.name,
        description: payload.description ?? null,
        domain: payload.domain,
        sortOrder: payload.sortOrder ?? 0,
        active: payload.active ?? true,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    return this.findOne(item.id);
  }

  async findByDomain(domain: Domain): Promise<StatusEntity[]> {
    return this.repo.find({ where: { domain, deletedAt: null } as any, order: { sortOrder: 'ASC' } });
  }

  async findByCode(code: string): Promise<StatusEntity | null> {
    return this.repo.findOne({ where: { code, deletedAt: null } as any });
  }

  validateTransition(domain: Domain, fromStatus: string | null | undefined, toStatus: string): boolean {
    const seq = SEQUENCES[domain];
    if (!seq) return false;
    const to = seq[toStatus];
    if (to === undefined) return false;
    if (!fromStatus) return to === 0;
    const from = seq[fromStatus];
    if (from === undefined) return false;
    return to > from || (to === 9 && from < 9);
  }
}
