import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyteEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateAnalyteDto } from '../dto/analyte.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class AnalytesService extends BaseLisService<AnalyteEntity> {
  constructor(
    @InjectRepository(AnalyteEntity) repo: Repository<AnalyteEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'analytes');
  }

  protected searchColumns(): string[] {
    return ['code', 'name'];
  }

  async create(payload: CreateAnalyteDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('test-definitions', payload.name ?? '');
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
