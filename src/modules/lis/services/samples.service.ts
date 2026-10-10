import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SampleEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateSampleDto } from '../dto/sample.dto';
import { StatusesService } from './statuses.service';
import { StatusHistoryService } from './status-history.service';
import { TenantContext } from '../../../common/tenant-context';
import { NotificationTriggersService } from './notification-triggers.service';

@Injectable()
export class SamplesService extends BaseLisService<SampleEntity> {
  constructor(
    @InjectRepository(SampleEntity) repo: Repository<SampleEntity>,
    private readonly statuses: StatusesService,
    private readonly statusHistory: StatusHistoryService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {
    super(repo, 'samples');
  }

  protected relations(): string[] {
    return ['order', 'status', 'sampleType'];
  }

  protected searchColumns(): string[] {
    return ['barcode', 'collector', 'collectionConditions', 'notes'];
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
        sampleTypeId: payload.sampleTypeId ?? null,
        collector: payload.collector ?? null,
        collectionDate: payload.collectionDate ? new Date(payload.collectionDate) : null,
        collectionMethod: payload.collectionMethod ?? null,
        collectionConditions: payload.collectionConditions ?? null,
        quantity: payload.quantity ?? null,
        notes: payload.notes ?? null,
        printStatus: payload.printStatus ?? 'PENDING',
        printedAt: payload.printedAt ? new Date(payload.printedAt) : null,
        storageLocationId: payload.storageLocationId ?? null,
        storageNotes: payload.storageNotes ?? null,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    return this.findOne(item.id);
  }

  /**
   * Marks a sample received at the lab (COLLECTED → RECEIVED), stamps
   * the receive date, and triggers the patient "sample received"
   * notification through the conversations module (#109).
   */
  async receiveSample(id: string, tenant?: TenantContext, userId?: string): Promise<any> {
    const sample = (await this.findOne(id, tenant)) as SampleEntity;
    const receivedStatus = await this.statuses.findByCode('RECEIVED');
    if (!receivedStatus) {
      throw new BadRequestException('Sample status "RECEIVED" not found');
    }
    if (sample.statusId === receivedStatus.id) {
      throw new BadRequestException('Sample is already received');
    }
    const fromCode = sample.status?.code ?? 'COLLECTED';
    if (!this.statuses.validateTransition('SAMPLE', fromCode, 'RECEIVED')) {
      throw new BadRequestException(`Invalid transition from "${fromCode}" to "RECEIVED"`);
    }

    const fromStatusId = sample.statusId;
    sample.statusId = receivedStatus.id;
    sample.receivedDate = new Date();
    await this.repo.save(sample);

    await this.statusHistory.record(
      'Sample',
      id,
      receivedStatus.id,
      fromStatusId,
      userId ?? tenant?.userId ?? null,
      'Sample received at laboratory',
      tenant,
    );

    const refreshed = (await this.findOne(id, tenant)) as SampleEntity;
    await this.notificationTriggers.sampleReceived(refreshed, tenant);
    return refreshed;
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
