import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusHistoryEntity } from '../entities';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class StatusHistoryService {
  constructor(
    @InjectRepository(StatusHistoryEntity) private readonly repo: Repository<StatusHistoryEntity>,
  ) {}

  async record(
    entityType: string,
    entityId: string,
    toStatusId: string,
    fromStatusId?: string | null,
    changedBy?: string | null,
    reason?: string | null,
    tenant?: TenantContext,
  ): Promise<StatusHistoryEntity> {
    return this.repo.save(
      this.repo.create({
        entityType,
        entityId,
        fromStatusId: fromStatusId ?? null,
        toStatusId,
        changedBy: changedBy ?? null,
        reason: reason ?? null,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
  }

  async findByEntity(entityType: string, entityId: string, tenant?: TenantContext): Promise<StatusHistoryEntity[]> {
    const qb = this.repo.createQueryBuilder('sh')
      .where('sh.entityType = :entityType', { entityType })
      .andWhere('sh.entityId = :entityId', { entityId});

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(sh.organization_id = :orgId OR sh.organization_id IS NULL)', { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere('(sh.location_id = :locId OR sh.location_id IS NULL)', { locId: tenant.locationId });
      }
    }

    return qb
      .leftJoinAndSelect('sh.fromStatus', 'fromStatus')
      .leftJoinAndSelect('sh.toStatus', 'toStatus')
      .orderBy('sh.created_at', 'ASC')
      .getMany();
  }
}
