import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, IsNull, Repository } from 'typeorm';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { normalizeTenantId, TenantContext } from '../../../common/tenant-context';
import { assertCanWriteRow } from '../../../common/tenant-scope';
import { LisBaseEntity, LocationEntity } from '../entities';

export interface ListResponse<T> {
  data: T[];
  total: number;
}

@Injectable()
export abstract class BaseLisService<T extends LisBaseEntity> {
  constructor(
    protected readonly repo: Repository<T>,
    protected readonly alias: string,
  ) {}

  protected relations(): string[] {
    return [];
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  protected defaultSort(): string {
    return `${this.alias}.created_at`;
  }

  protected sortColumn(sortBy?: string): string {
    return sortBy ? `${this.alias}.${sortBy}` : this.defaultSort();
  }

  protected serialize(item: T): any {
    return item;
  }

  protected applyTenantFilter(qb: any, tenant?: TenantContext): void {
    if (!tenant || tenant.isGlobalAdmin) return;

    qb.andWhere(`(
      ${this.alias}.organization_id = :orgId
      OR ${this.alias}.organization_id IS NULL
    )`, { orgId: tenant.organizationId });

    if (tenant.locationId) {
      qb.andWhere(`(
        ${this.alias}.location_id = :locId
        OR ${this.alias}.location_id IS NULL
      )`, { locId: tenant.locationId });
    }
  }

  protected listFilters(_query: Record<string, string>): Record<string, string> {
    return {};
  }

  async list(query: ListQueryDto & Record<string, string>, tenant?: TenantContext): Promise<ListResponse<T>> {
    const qb = this.repo
      .createQueryBuilder(this.alias)
      .where(`${this.alias}.deleted_at IS NULL`);

    this.applyTenantFilter(qb, tenant);

    for (const relation of this.relations()) {
      if (!relation.includes('.')) {
        qb.leftJoinAndSelect(`${this.alias}.${relation}`, relation);
      } else {
        // e.g. items.testDefinition -> join items.testDefinition, alias last segment
        const parts = relation.split('.');
        const parentAlias = parts[0];
        const childPath = parts[1];
        qb.leftJoinAndSelect(`${parentAlias}.${childPath}`, childPath);
      }
    }

    if (query.search) {
      qb.andWhere(
        new Brackets((where) => {
          for (const column of this.searchColumns()) {
            where.orWhere(`${this.alias}.${column} ILIKE :search`, {
              search: `%${query.search}%`,
            });
          }
        }),
      );
    }

    for (const [column, value] of Object.entries(this.listFilters(query))) {
      qb.andWhere(`${this.alias}.${column} = :${column}`, { [column]: value });
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    qb.orderBy(this.sortColumn(query.sortBy), query.sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map((item) => this.serialize(item)), total };
  }

  async findOne(id: string, tenant?: TenantContext): Promise<any> {
    const qb = this.repo.createQueryBuilder(this.alias)
      .where(`${this.alias}.id = :id`, { id })
      .andWhere(`${this.alias}.deleted_at IS NULL`);

    this.applyTenantFilter(qb, tenant);

    for (const relation of this.relations()) {
      if (!relation.includes('.')) {
        qb.leftJoinAndSelect(`${this.alias}.${relation}`, relation);
      } else {
        const parts = relation.split('.');
        const parentAlias = parts[0];
        const childPath = parts[1];
        qb.leftJoinAndSelect(`${parentAlias}.${childPath}`, childPath);
      }
    }

    const item = await qb.getOne();
    if (!item) {
      throw new NotFoundException('Record not found');
    }
    return this.serialize(item);
  }

  /**
   * Columns that may never be reassigned.
   *
   * - `organizationId` is the tenant boundary: only a super admin may move a
   *   record between organisations.
   * - `locationId` is operational: a tenant may move a record between sites of
   *   its own organisation, so it is allowed but validated below (a location
   *   from another organisation is rejected).
   */
  private blockedUpdateColumns(tenant?: TenantContext): Set<string> {
    const blocked = new Set([
      'id',
      'createdAt',
      'created_at',
      'updatedAt',
      'updated_at',
      'deletedAt',
      'deleted_at',
      'organizationId',
      'organization_id',
    ]);
    if (tenant?.isSuperAdmin) {
      blocked.delete('organizationId');
      blocked.delete('organization_id');
    }
    return blocked;
  }

  /**
   * A location is assignable within the tenant's own organisation. A super
   * admin may assign any location; a normal tenant may only use a location
   * owned by its organisation (or a shared/null-org location).
   */
  private async assertLocationAssignable(
    locationId: unknown,
    tenant?: TenantContext,
  ): Promise<void> {
    if (!tenant || tenant.isSuperAdmin) return;
    const id = normalizeTenantId(locationId);
    if (!id) return;

    const location = await this.repo.manager
      .getRepository(LocationEntity)
      .findOne({ where: { id } as any });
    if (!location) {
      throw new BadRequestException('Location not found');
    }
    if (
      location.organizationId &&
      tenant.organizationId &&
      location.organizationId !== tenant.organizationId
    ) {
      throw new ForbiddenException(
        'Location does not belong to the organisation',
      );
    }
  }

  private async validateLocationUpdate(
    payload: Record<string, unknown>,
    tenant?: TenantContext,
  ): Promise<void> {
    if ('locationId' in payload) {
      await this.assertLocationAssignable(payload.locationId, tenant);
    }
    if ('location_id' in payload) {
      await this.assertLocationAssignable(payload.location_id, tenant);
    }
  }

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    // Shared/global rows are read-only for normal tenants.
    assertCanWriteRow(item as any, tenant);
    await this.validateLocationUpdate(payload, tenant);
    const blocked = this.blockedUpdateColumns(tenant);
    for (const [key, value] of Object.entries(payload)) {
      if (!blocked.has(key)) {
        (item as any)[key] = value;
      }
    }
    await this.repo.save(item);
    return this.findOne(id, tenant);
  }

  async replace(id: string, payload: any, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    assertCanWriteRow(item as any, tenant);
    await this.validateLocationUpdate(payload, tenant);
    const blocked = this.blockedUpdateColumns(tenant);
    for (const [key, value] of Object.entries(payload)) {
      if (!blocked.has(key)) {
        (item as any)[key] = value;
      }
    }
    await this.repo.save(item);
    return this.findOne(id, tenant);
  }

  async archive(id: string, tenant?: TenantContext): Promise<void> {
    const item = await this.findOne(id, tenant);
    assertCanWriteRow(item as any, tenant);
    const result = await this.repo.softDelete(item.id);
    if (!result.affected) {
      throw new NotFoundException('Record not found');
    }
  }
}
