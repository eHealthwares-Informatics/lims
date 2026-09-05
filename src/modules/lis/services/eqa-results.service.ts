import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EqaResultEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateEqaResultDto, EvaluateEqaResultDto } from '../dto/eqa-result.dto';

@Injectable()
export class EqaResultsService extends BaseLisService<EqaResultEntity> {
  constructor(
    @InjectRepository(EqaResultEntity) repo: Repository<EqaResultEntity>,
  ) {
    super(repo, 'eqa_results');
  }

  protected relations(): string[] {
    return ['enrollment', 'enrollment.program', 'enrollment.testDefinition'];
  }

  protected searchColumns(): string[] {
    return ['sampleNumber', 'evaluation'];
  }

  async create(payload: CreateEqaResultDto): Promise<any> {
    const item = await this.repo.save(
      this.repo.create({
        enrollmentId: payload.enrollmentId,
        sampleNumber: payload.sampleNumber,
        value: payload.value ?? null,
        submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date(),
      }),
    );
    return this.findOne(item.id);
  }

  async findByEnrollment(enrollmentId: string): Promise<EqaResultEntity[]> {
    return this.repo.find({
      where: { enrollmentId, deletedAt: null } as any,
      relations: ['enrollment'],
      order: { sampleNumber: 'ASC' },
    });
  }

  async evaluate(id: string, dto: EvaluateEqaResultDto): Promise<any> {
    const item = await this.repo.findOne({ where: { id, deletedAt: null } as any });
    if (!item) throw new Error('Result not found');
    item.expectedValue = dto.expectedValue ?? null;
    item.zScore = dto.zScore ?? null;
    item.evaluation = (dto.evaluation as any) ?? null;
    item.feedback = dto.feedback ?? null;
    item.evaluatedAt = dto.evaluatedAt ? new Date(dto.evaluatedAt) : new Date();
    await this.repo.save(item);
    return this.findOne(id);
  }
}