import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferenceTableEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateReferenceTableDto } from '../dto/reference-table.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class ReferenceTablesService extends BaseLisService<ReferenceTableEntity> {
  constructor(@InjectRepository(ReferenceTableEntity) repo: Repository<ReferenceTableEntity>) {
    super(repo, 'reference_tables');
  }

  protected searchColumns(): string[] {
    return ['name'];
  }

  async create(payload: CreateReferenceTableDto, tenant?: TenantContext): Promise<any> {
    const duplicate = await this.repo.findOne({ where: { name: payload.name, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Name already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        name: payload.name,
        keepHistory: payload.keepHistory ?? false,
        isHl7Encoded: payload.isHl7Encoded ?? false,
      }),
    );
    return this.findOne(item.id);
  }
}
