import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SampleTypeEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateSampleTypeDto } from '../dto/sample-type.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class SampleTypesService extends BaseLisService<SampleTypeEntity> {
  constructor(
    @InjectRepository(SampleTypeEntity) repo: Repository<SampleTypeEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'sample_types');
  }

  protected searchColumns(): string[] {
    return ['name', 'key', 'accession_code'];
  }

  async create(payload: CreateSampleTypeDto, tenant?: TenantContext): Promise<any> {
    const key = payload.key ?? this.codes.generate('sample-types', payload.name).replace('SMP-', '');
    const duplicate = await this.repo.findOne({ where: [{ key }, { accessionCode: payload.accessionCode }] as any });
    if (duplicate) {
      throw new BadRequestException('Sample type key or accession code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        name: payload.name,
        description: payload.description ?? null,
        key,
        accessionCode: payload.accessionCode.toUpperCase(),
        defaultQuantity: payload.defaultQuantity ?? null,
        minimumQuantity: payload.minimumQuantity ?? null,
        unit: payload.unit ?? null,
        containerType: payload.containerType ?? null,
        collectionInstructions: payload.collectionInstructions ?? null,
        storageRequirements: payload.storageRequirements ?? null,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
