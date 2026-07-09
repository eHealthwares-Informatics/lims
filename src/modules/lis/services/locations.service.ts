import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AttributeDefinitionEntity, AttributeValueEntity, LocationEntity, LocationTypeDefinitionEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateLocationDto } from '../dto/location.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class LocationsService extends BaseLisService<LocationEntity> {
  constructor(
    @InjectRepository(LocationEntity) repo: Repository<LocationEntity>,
    @InjectRepository(LocationTypeDefinitionEntity) private readonly locationTypeRepo: Repository<LocationTypeDefinitionEntity>,
    @InjectRepository(AttributeValueEntity) private readonly attributeValueRepo: Repository<AttributeValueEntity>,
    @InjectRepository(AttributeDefinitionEntity) private readonly attrDefRepo: Repository<AttributeDefinitionEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'locations');
  }

  protected searchColumns(): string[] {
    return ['name', 'reference'];
  }

  protected relations(): string[] {
    return ['type', 'parent', 'attributeValues', 'attributeValues.definition'];
  }

  protected serialize(item: LocationEntity): any {
    return { ...item, typeId: item.type?.id, parentId: item.parent?.id };
  }

  async create(payload: CreateLocationDto, tenant?: TenantContext): Promise<any> {
    const type = await this.locationTypeRepo.findOne({
      where: { id: payload.typeId, deletedAt: null } as any,
      relations: ['allowedChildTypes'],
    });
    if (!type || !type.active) {
      throw new BadRequestException('Active location type not found');
    }
    const parent = payload.parentId
      ? await this.repo.findOne({ where: { id: payload.parentId, deletedAt: null } as any, relations: ['type', 'type.allowedChildTypes'] })
      : null;
    if (payload.parentId && !parent) {
      throw new BadRequestException('Parent location not found');
    }
    if (parent && (!parent.active || !parent.type.allowChildren || !parent.type.allowedChildTypes.some((ct) => ct.id === type.id))) {
      throw new BadRequestException(`${type.name} is not allowed under ${parent.type.name}`);
    }
    const location = await this.repo.save(
      this.repo.create({
        name: payload.name,
        reference: payload.reference ?? this.codes.generate('locations', payload.name),
        type,
        parent,
        active: payload.active ?? true,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    if (payload.attributeValues?.length) {
      const definitions = await this.attrDefRepo.findBy({ id: In(payload.attributeValues.map((v) => v.attributeDefinitionId)) });
      await this.attributeValueRepo.save(
        payload.attributeValues.map((v) =>
          this.attributeValueRepo.create({
            location,
            definition: definitions.find((d) => d.id === v.attributeDefinitionId),
            value: v.value ?? null,
          }),
        ),
      );
    }
    return this.findOne(location.id);
  }
}
