import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinitionEntity, LisAttributeDataType, LocationTypeDefinitionEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateAttributeDefinitionDto } from '../dto/attribute-definition.dto';

@Injectable()
export class AttributeDefinitionsService extends BaseLisService<AttributeDefinitionEntity> {
  constructor(
    @InjectRepository(AttributeDefinitionEntity) repo: Repository<AttributeDefinitionEntity>,
    @InjectRepository(LocationTypeDefinitionEntity) private readonly locationTypeRepo: Repository<LocationTypeDefinitionEntity>,
  ) {
    super(repo, 'attribute_definitions');
  }

  protected searchColumns(): string[] {
    return ['name', 'key'];
  }

  protected relations(): string[] {
    return ['appliesToType'];
  }

  protected serialize(item: AttributeDefinitionEntity): any {
    return {
      ...item,
      appliesToTypeId: item.appliesToType?.id,
    };
  }

  async create(payload: CreateAttributeDefinitionDto): Promise<any> {
    const appliesToType = await this.locationTypeRepo.findOne({ where: { id: payload.appliesToTypeId, deletedAt: null } as any });
    if (!appliesToType) {
      throw new BadRequestException('Location type not found');
    }
    const item = await this.repo.save(
      this.repo.create({
        key: payload.key ?? payload.name.toLowerCase().replace(/\W+/g, '_'),
        name: payload.name,
        description: payload.description ?? null,
        appliesToType,
        dataType: (payload.dataType as LisAttributeDataType) ?? LisAttributeDataType.TEXT,
        required: payload.required ?? false,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
