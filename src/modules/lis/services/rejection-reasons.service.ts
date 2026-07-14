import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RejectionReasonEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { NamedCodeDto } from '../dto/named-code.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class RejectionReasonsService extends BaseLisService<RejectionReasonEntity> {
  constructor(
    @InjectRepository(RejectionReasonEntity) repo: Repository<RejectionReasonEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'rejection_reasons');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  async create(payload: NamedCodeDto, tenant?: TenantContext): Promise<any> {
    const code = payload.code ?? this.codes.generate('rejection-reasons', payload.name ?? '');
    if (!this.codes.isValid('rejection-reasons', code)) {
      throw new BadRequestException(`Invalid code for rejection-reasons ${this.codes.expression('rejection-reasons')}`);
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
