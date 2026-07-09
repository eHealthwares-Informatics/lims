import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SampleEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateSampleDto } from '../dto/sample.dto';
import { StatusesService } from './statuses.service';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class SamplesService extends BaseLisService<SampleEntity> {
  constructor(
    @InjectRepository(SampleEntity) repo: Repository<SampleEntity>,
    private readonly statuses: StatusesService,
  ) {
    super(repo, 'samples');
  }

  protected relations(): string[] {
    return ['order', 'status'];
  }

  protected searchColumns(): string[] {
    return ['barcode'];
  }

  async create(payload: CreateSampleDto, tenant?: TenantContext): Promise<any> {
    const initialStatus = await this.statuses.findByCode('COLLECTED');
    if (!initialStatus) {
      throw new BadRequestException('Initial sample status "COLLECTED" not found');
    }
    const item = await this.repo.save(
      this.repo.create({
        orderId: payload.orderId,
        barcode: payload.barcode,
        statusId: initialStatus.id,
        sampleType: payload.sampleType ?? null,
        collector: payload.collector ?? null,
        collectionDate: payload.collectionDate ? new Date(payload.collectionDate) : null,
        collectionMethod: payload.collectionMethod ?? null,
        collectionConditions: payload.collectionConditions ?? null,
        quantity: payload.quantity ?? null,
        notes: payload.notes ?? null,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    return this.findOne(item.id);
  }

  async findByOrder(orderId: string, tenant?: TenantContext): Promise<SampleEntity[]> {
    const qb = this.repo.createQueryBuilder('sample')
      .where('sample.order_id = :orderId', { orderId })
      .andWhere('sample.deleted_at IS NULL');

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(sample.organization_id = :orgId OR sample.organization_id IS NULL)', { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere('(sample.location_id = :locId OR sample.location_id IS NULL)', { locId: tenant.locationId });
      }
    }

    return qb.leftJoinAndSelect('sample.order', 'order')
      .leftJoinAndSelect('sample.status', 'status')
      .getMany();
  }

  async findReceived(tenant?: TenantContext): Promise<SampleEntity[]> {
    const status = await this.statuses.findByCode('RECEIVED');
    if (!status) return [];
    const qb = this.repo.createQueryBuilder('sample')
      .where('sample.status_id = :statusId', { statusId: status.id })
      .andWhere('sample.deleted_at IS NULL');

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(sample.organization_id = :orgId OR sample.organization_id IS NULL)', { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere('(sample.location_id = :locId OR sample.location_id IS NULL)', { locId: tenant.locationId });
      }
    }

    return qb.leftJoinAndSelect('sample.order', 'order')
      .leftJoinAndSelect('sample.status', 'status')
      .getMany();
  }
}
