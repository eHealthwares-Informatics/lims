import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LocationTypeDefinitionEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateLocationTypeDefinitionDto } from '../dto/location-type-definition.dto';

@Injectable()
export class LocationTypesService extends BaseLisService<LocationTypeDefinitionEntity> {
  constructor(
    @InjectRepository(LocationTypeDefinitionEntity) repo: Repository<LocationTypeDefinitionEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'location_types');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  protected relations(): string[] {
    return ['allowedChildTypes', 'attributeDefinitions'];
  }

  protected serialize(item: LocationTypeDefinitionEntity): any {
    return {
      ...item,
      allowedChildTypeIds: item.allowedChildTypes?.map((t) => t.id) ?? [],
    };
  }

  async create(payload: CreateLocationTypeDefinitionDto): Promise<any> {
    const code = payload.code ?? this.codes.generate('location-types', payload.name ?? '').replace('LOC-', '');
    const allowedChildTypes = payload.allowedChildTypeIds?.length
      ? await this.repo.findBy({ id: In(payload.allowedChildTypeIds) })
      : [];
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        allowChildren: payload.allowChildren ?? allowedChildTypes.length > 0,
        allowedChildTypes,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<any> {
    const item = await this.repo.findOne({ where: { id, deletedAt: null } as any, relations: ['allowedChildTypes'] });
    if (!item) {
      throw new BadRequestException('Record not found');
    }
    if (payload.name) item.name = payload.name as string;
    if (payload.description !== undefined) item.description = payload.description as string | null;
    if (payload.allowChildren !== undefined) item.allowChildren = payload.allowChildren as boolean;
    if (payload.active !== undefined) item.active = payload.active as boolean;
    if (payload.allowedChildTypeIds) {
      const ids = payload.allowedChildTypeIds as string[];
      item.allowedChildTypes = ids.length ? await this.repo.findBy({ id: In(ids) }) : [];
    }
    await this.repo.save(item);
    return this.findOne(id);
  }

  async archive(id: string): Promise<void> {
    await this.cascadeDisable(id);
    await super.archive(id);
  }

  private async cascadeDisable(id: string): Promise<void> {
    const childTypes = await this.repo
      .createQueryBuilder('type')
      .leftJoin('type.allowedChildTypes', 'parent')
      .where('parent.id = :id', { id })
      .getMany();
    if (childTypes.length) {
      await this.repo.update({ id: In(childTypes.map((t) => t.id)) }, { active: false });
    }
  }
}
