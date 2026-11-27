import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { PatientEntity } from '../entities/patient.entity';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';

/** One lab result as the patient app shows it. */
export type PatientLabResult = {
  id: string;
  orderNumber: string;
  test: string;
  value: string | null;
  status: string;
  date: Date | string | null;
};

/**
 * Lab records for the patient behind the current token.
 *
 * The patient never supplies a patient id: it is resolved from the caller's
 * identity (`userId` → `participantId` → `phone`), so a token cannot be used to
 * read somebody else's results.
 */
@Injectable()
export class PatientRecordsService {
  private readonly logger = new Logger(PatientRecordsService.name);

  constructor(
    @InjectRepository(PatientEntity)
    private readonly patients: Repository<PatientEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly items: Repository<OrderItemEntity>,
  ) {}

  /** The patient row behind the caller, or null when nothing matches. */
  async resolvePatient(identity: {
    userId?: string | null;
    participantId?: string | null;
    phone?: string | null;
  }): Promise<PatientEntity | null> {
    const candidates: Array<Record<string, unknown>> = [];
    if (identity.userId) candidates.push({ externalUserId: identity.userId });
    if (identity.participantId) {
      candidates.push({ participantId: identity.participantId });
    }
    if (identity.phone) candidates.push({ phone: identity.phone });

    for (const where of candidates) {
      const found = await this.patients.findOne({
        where: { ...where, deletedAt: IsNull() },
      });
      if (found) return found;
    }
    return null;
  }

  async records(identity: {
    userId?: string | null;
    participantId?: string | null;
    phone?: string | null;
    limit?: number;
  }): Promise<{ patientId: string | null; labResults: PatientLabResult[] }> {
    const patient = await this.resolvePatient(identity);
    if (!patient) {
      this.logger.debug('[patient-records] no patient for caller');
      return { patientId: null, labResults: [] };
    }

    const orders = await this.orders.find({
      where: { patientId: patient.patientId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: Math.min(identity.limit ?? 50, 200),
    });
    if (!orders.length) {
      return { patientId: patient.patientId, labResults: [] };
    }

    const items = await this.items.find({
      where: {
        order: { id: In(orders.map((order) => order.id)) },
        deletedAt: IsNull(),
      },
      relations: { order: true },
    });

    const orderById = new Map(orders.map((order) => [order.id, order]));
    const labResults = items.map<PatientLabResult>((item) => {
      const order = orderById.get(item.order?.id) ?? item.order;
      return {
        id: item.id,
        orderNumber: order?.orderNumber ?? '',
        test: item.referenceCode ?? item.testDefinitionId,
        value: item.resultValue ?? null,
        status: item.status,
        date: item.resultDate ?? order?.createdAt ?? null,
      };
    });

    return { patientId: patient.patientId, labResults };
  }
}
