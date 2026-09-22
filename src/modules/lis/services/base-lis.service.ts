import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, IsNull, Repository } from 'typeorm';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { TenantContext } from '../../../common/tenant-context';
import { LisBaseEntity } from '../entities';

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

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    const blocked = new Set(['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'deletedAt', 'deleted_at', 'organizationId', 'organization_id', 'locationId', 'location_id']);
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
    const blocked = new Set(['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'deletedAt', 'deleted_at', 'organizationId', 'organization_id', 'locationId', 'location_id']);
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
    const result = await this.repo.softDelete(item.id);
    if (!result.affected) {
      throw new NotFoundException('Record not found');
    }
  }
}
