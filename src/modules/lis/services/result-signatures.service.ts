import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultSignatureEntity } from '../entities';
import { CreateSignatureDto } from '../dto/result-signature.dto';

@Injectable()
export class ResultSignaturesService {
  constructor(
    @InjectRepository(ResultSignatureEntity) private readonly repo: Repository<ResultSignatureEntity>,
  ) {}

  async sign(dto: CreateSignatureDto): Promise<ResultSignatureEntity> {
    return this.repo.save(
      this.repo.create({
        resultId: dto.resultId,
        userId: dto.userId ?? null,
        userName: dto.userName ?? null,
        isSupervisor: dto.isSupervisor ?? false,
        signatureData: dto.signatureData ?? null,
        signedAt: new Date(),
        notes: dto.notes ?? null,
      }),
    );
  }

  async findByResult(resultId: string): Promise<ResultSignatureEntity[]> {
    return this.repo.find({
      where: { resultId },
      order: { signedAt: 'ASC' },
    });
  }

  async hasTechnicalSignature(resultId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { resultId, isSupervisor: false },
    });
    return count > 0;
  }

  async hasSupervisorSignature(resultId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { resultId, isSupervisor: true },
    });
    return count > 0;
  }

  async getSignatureStatus(resultId: string): Promise<{ technical: boolean; supervisor: boolean }> {
    const [technical, supervisor] = await Promise.all([
      this.hasTechnicalSignature(resultId),
      this.hasSupervisorSignature(resultId),
    ]);
    return { technical, supervisor };
  }
}
