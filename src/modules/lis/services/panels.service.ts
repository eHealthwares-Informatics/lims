import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PanelEntity, PanelItemEntity, TestDefinitionEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreatePanelDto } from '../dto/panel.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class PanelsService extends BaseLisService<PanelEntity> {
  constructor(
    @InjectRepository(PanelEntity) repo: Repository<PanelEntity>,
    @InjectRepository(PanelItemEntity) private readonly panelItemRepo: Repository<PanelItemEntity>,
    @InjectRepository(TestDefinitionEntity) private readonly testDefRepo: Repository<TestDefinitionEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'panels');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  protected relations(): string[] {
    return ['panelItems', 'panelItems.test'];
  }

  protected serialize(item: PanelEntity): any {
    return {
      ...item,
      items: item.panelItems?.map((pi) => ({
        id: pi.id,
        testId: pi.test?.id,
        sortOrder: pi.sortOrder,
      })) ?? [],
    };
  }

  async create(payload: CreatePanelDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('panels', payload.name ?? '');
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const panel = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        active: payload.active ?? true,
      }),
    );
    if (payload.items?.length) {
      const tests = await this.testDefRepo.find({ where: { id: In(payload.items.map((i) => i.testId)) } });
      await this.panelItemRepo.save(
        payload.items.map((item) =>
          this.panelItemRepo.create({
            panel,
            test: tests.find((t) => t.id === item.testId)!,
            sortOrder: item.sortOrder ?? 0,
          }),
        ),
      );
    }
    return this.findOne(panel.id);
  }

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const panel = await this.repo.findOne({ where: { id, deletedAt: null } as any, relations: ['panelItems'] });
    if (!panel) {
      throw new BadRequestException('Panel not found');
    }
    if (payload.name) panel.name = payload.name as string;
    if (payload.description !== undefined) panel.description = payload.description as string | null;
    if (payload.active !== undefined) panel.active = payload.active as boolean;
    await this.repo.save(panel);

    if (payload.items) {
      const items = payload.items as Array<{ testId: string; sortOrder?: number }>;
      await this.panelItemRepo.delete({ panel: { id } });
      if (items.length) {
        const tests = await this.testDefRepo.find({ where: { id: In(items.map((i) => i.testId)) } });
        await this.panelItemRepo.save(
          items.map((item) =>
            this.panelItemRepo.create({
              panel,
              test: tests.find((t) => t.id === item.testId)!,
              sortOrder: item.sortOrder ?? 0,
            }),
          ),
        );
      }
    }
    return this.findOne(id);
  }
}
