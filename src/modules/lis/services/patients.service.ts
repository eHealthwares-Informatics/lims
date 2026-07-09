import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async list(query: ListQueryDto & Record<string, string>, tenant?: TenantContext): Promise<{ data: any[]; total: number }> {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .select([
        'order.patientId',
        'order.patientName',
        'order.patientAge',
        'order.patientGender',
        'order.patientDateOfBirth',
        'order.internalReference',
        'order.externalReference',
      ])
      .where('order.deleted_at IS NULL')

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere(`(order.organization_id = :orgId OR order.organization_id IS NULL)`, { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere(`(order.location_id = :locId OR order.location_id IS NULL)`, { locId: tenant.locationId });
      }
    }

    qb.groupBy('order.patientId')
      .addGroupBy('order.patientName')
      .addGroupBy('order.patientAge')
      .addGroupBy('order.patientGender')
      .addGroupBy('order.patientDateOfBirth')
      .addGroupBy('order.internalReference')
      .addGroupBy('order.externalReference');

    if (query.search) {
      qb.andWhere(
        '(order.patientId ILIKE :search OR order.patientName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('order.patientName', 'ASC')
      .skip(query.offset)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, tenant?: TenantContext): Promise<any> {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .where('order.patientId = :id AND order.deleted_at IS NULL', { id });

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere(`(order.organization_id = :orgId OR order.organization_id IS NULL)`, { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere(`(order.location_id = :locId OR order.location_id IS NULL)`, { locId: tenant.locationId });
      }
    }

    const item = await qb.getOne();
    if (!item) {
      throw new NotFoundException('Patient not found');
    }
    return {
      patientId: item.patientId,
      patientName: item.patientName,
      patientAge: item.patientAge,
      patientGender: item.patientGender,
      patientDateOfBirth: item.patientDateOfBirth,
      internalReference: item.internalReference,
      externalReference: item.externalReference,
    };
  }
}
