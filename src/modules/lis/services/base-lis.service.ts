import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, IsNull, Repository } from 'typeorm';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
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

  async list(query: ListQueryDto & Record<string, string>): Promise<ListResponse<T>> {
    const qb = this.repo
      .createQueryBuilder(this.alias)
      .where(`${this.alias}.deleted_at IS NULL`);

    for (const relation of this.relations()) {
      if (!relation.includes('.')) {
        qb.leftJoinAndSelect(`${this.alias}.${relation}`, relation);
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

    qb.orderBy(this.sortColumn(query.sortBy), query.sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip(query.offset)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map((item) => this.serialize(item)), total };
  }

  async findOne(id: string): Promise<any> {
    const item = await this.repo.findOne({
      where: { id, deletedAt: IsNull() } as any,
      relations: this.relations(),
    });
    if (!item) {
      throw new NotFoundException('Record not found');
    }
    return this.serialize(item);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<any> {
    const item = await this.repo.findOne({
      where: { id, deletedAt: IsNull() } as any,
    });
    if (!item) {
      throw new NotFoundException('Record not found');
    }
    const blocked = new Set(['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'deletedAt', 'deleted_at']);
    for (const [key, value] of Object.entries(payload)) {
      if (!blocked.has(key) && !key.endsWith('Id') && !key.endsWith('Ids')) {
        (item as any)[key] = value;
      }
    }
    await this.repo.save(item);
    return this.findOne(id);
  }

  async archive(id: string): Promise<void> {
    const result = await this.repo.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException('Record not found');
    }
  }
}
