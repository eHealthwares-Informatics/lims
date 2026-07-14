import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoincEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateLoincDto } from '../dto/loinc.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class LoincService extends BaseLisService<LoincEntity> {
  constructor(
    @InjectRepository(LoincEntity) repo: Repository<LoincEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'loinc');
  }

  protected searchColumns(): string[] {
    return ['name', 'code', 'component', 'system'];
  }

  async create(payload: CreateLoincDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('loinc', payload.name);
    if (!this.codes.isValid('loinc', code)) {
      throw new BadRequestException(`Invalid code for loinc ${this.codes.expression('loinc')}`);
    }
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        system: payload.system ?? null,
        component: payload.component ?? null,
        property: payload.property ?? null,
        scale: payload.scale ?? null,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
