import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestCategoryEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { NamedCodeDto } from '../dto/named-code.dto';

@Injectable()
export class TestCategoriesService extends BaseLisService<TestCategoryEntity> {
  constructor(
    @InjectRepository(TestCategoryEntity) repo: Repository<TestCategoryEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'test_categories');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  async create(payload: NamedCodeDto): Promise<any> {
    const code = payload.code ?? this.codes.generate('test-categories', payload.name ?? '');
    if (!this.codes.isValid('test-categories', code)) {
      throw new BadRequestException(`Invalid code for test-categories ${this.codes.expression('test-categories')}`);
    }
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
