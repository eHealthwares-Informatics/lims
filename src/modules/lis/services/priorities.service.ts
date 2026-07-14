import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriorityEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreatePriorityDto } from '../dto/priority.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class PrioritiesService extends BaseLisService<PriorityEntity> {
  constructor(
    @InjectRepository(PriorityEntity) repo: Repository<PriorityEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'priorities');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  async create(payload: CreatePriorityDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('priorities', payload.name ?? '');
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        index: payload.index ?? 0,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
