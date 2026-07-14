import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProgramEntity, TestDefinitionEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateProgramDto } from '../dto/program.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class ProgramsService extends BaseLisService<ProgramEntity> {
  constructor(
    @InjectRepository(ProgramEntity) repo: Repository<ProgramEntity>,
    @InjectRepository(TestDefinitionEntity) private readonly testDefRepo: Repository<TestDefinitionEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'programs');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  protected relations(): string[] {
    return ['testDefinitions'];
  }

  protected serialize(item: ProgramEntity): any {
    return {
      ...item,
      testDefinitionIds: item.testDefinitions?.map((t) => t.id) ?? [],
    };
  }

  async create(payload: CreateProgramDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('programs', payload.name ?? '');
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const testDefinitions = payload.testDefinitionIds?.length
      ? await this.testDefRepo.findBy({ id: In(payload.testDefinitionIds) })
      : [];
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        testDefinitions,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const item = await this.repo.findOne({ where: { id, deletedAt: null } as any, relations: ['testDefinitions'] });
    if (!item) {
      throw new BadRequestException('Record not found');
    }
    if (payload.name) item.name = payload.name as string;
    if (payload.description !== undefined) item.description = payload.description as string | null;
    if (payload.active !== undefined) item.active = payload.active as boolean;
    if (payload.testDefinitionIds) {
      const ids = payload.testDefinitionIds as string[];
      item.testDefinitions = ids.length ? await this.testDefRepo.findBy({ id: In(ids) }) : [];
    }
    await this.repo.save(item);
    return this.findOne(id);
  }
}
