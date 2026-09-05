import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EqaProgramEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateEqaProgramDto } from '../dto/eqa-program.dto';

@Injectable()
export class EqaProgramsService extends BaseLisService<EqaProgramEntity> {
  constructor(
    @InjectRepository(EqaProgramEntity) repo: Repository<EqaProgramEntity>,
  ) {
    super(repo, 'eqa_programs');
  }

  protected searchColumns(): string[] {
    return ['name', 'code', 'provider'];
  }

  async create(payload: CreateEqaProgramDto): Promise<any> {
    const existing = await this.repo.findOne({ where: { code: payload.code, deletedAt: null } as any });
    if (existing) {
      throw new BadRequestException('EQA program code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code: payload.code,
        name: payload.name,
        provider: payload.provider ?? null,
        description: payload.description ?? null,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }

  async findActive(): Promise<EqaProgramEntity[]> {
    return this.repo.find({ where: { active: true, deletedAt: null } as any, order: { name: 'ASC' } });
  }
}