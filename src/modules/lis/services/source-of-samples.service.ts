import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceOfSampleEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateSourceOfSampleDto } from '../dto/source-of-sample.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class SourceOfSamplesService extends BaseLisService<SourceOfSampleEntity> {
  constructor(@InjectRepository(SourceOfSampleEntity) repo: Repository<SourceOfSampleEntity>) {
    super(repo, 'source_of_samples');
  }

  protected searchColumns(): string[] {
    return ['code', 'description'];
  }

  async create(payload: CreateSourceOfSampleDto, tenant?: TenantContext): Promise<any> {
    const duplicate = await this.repo.findOne({ where: { code: payload.code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code: payload.code,
        description: payload.description,
        domain: payload.domain ?? 'H',
      }),
    );
    return this.findOne(item.id);
  }
}
