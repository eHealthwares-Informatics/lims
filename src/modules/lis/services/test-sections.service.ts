import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSectionEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateTestSectionDto } from '../dto/test-section.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class TestSectionsService extends BaseLisService<TestSectionEntity> {
  constructor(
    @InjectRepository(TestSectionEntity) repo: Repository<TestSectionEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'test_sections');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  async create(payload: CreateTestSectionDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('test-sections', payload.name ?? '');
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        sortOrder: payload.sortOrder ?? 0,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
