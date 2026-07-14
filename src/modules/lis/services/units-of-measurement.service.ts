import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitOfMeasurementEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { NamedCodeDto } from '../dto/named-code.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class UnitsOfMeasurementService extends BaseLisService<UnitOfMeasurementEntity> {
  constructor(
    @InjectRepository(UnitOfMeasurementEntity) repo: Repository<UnitOfMeasurementEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'uoms');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  async create(payload: NamedCodeDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('uoms', payload.name ?? '');
    if (!this.codes.isValid('uoms', code)) {
      throw new BadRequestException(`Invalid code for uoms ${this.codes.expression('uoms')}`);
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
