import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateOrderDto } from '../dto/order.dto';

@Injectable()
export class OrdersService extends BaseLisService<OrderEntity> {
  constructor(
    @InjectRepository(OrderEntity) repo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItemRepo: Repository<OrderItemEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'orders');
  }

  protected searchColumns(): string[] {
    return ['orderNumber'];
  }

  protected relations(): string[] {
    return ['patient', 'priority', 'items', 'items.testDefinition'];
  }

  protected serialize(item: OrderEntity): any {
    return {
      ...item,
      items: item.items?.map((oi) => ({
        id: oi.id,
        testDefinitionId: oi.testDefinition?.id,
        testDefinition: oi.testDefinition,
        status: oi.status,
        resultValue: oi.resultValue,
        resultDate: oi.resultDate,
        notes: oi.notes,
      })) ?? [],
    };
  }

  async create(payload: CreateOrderDto): Promise<any> {
    const orderNumber = this.codes.generate('orders', `ORD-${Date.now()}`);
    const order = await this.repo.save(
      this.repo.create({
        orderNumber,
        patientId: payload.patientId,
        priorityId: payload.priorityId ?? null,
        requestedDate: payload.requestedDate ?? null,
        notes: payload.notes ?? null,
        status: 'PENDING',
      }),
    );
    if (payload.items?.length) {
      await this.orderItemRepo.save(
        payload.items.map((item) =>
          this.orderItemRepo.create({
            order,
            testDefinitionId: item.testDefinitionId,
            notes: item.notes ?? null,
            status: 'PENDING',
          }),
        ),
      );
    }
    return this.findOne(order.id);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<any> {
    const order = await this.repo.findOne({ where: { id, deletedAt: null } as any });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (payload.status) order.status = payload.status as string;
    if (payload.collectedDate !== undefined) order.collectedDate = payload.collectedDate as string | null;
    if (payload.completedDate !== undefined) order.completedDate = payload.completedDate as string | null;
    if (payload.notes !== undefined) order.notes = payload.notes as string | null;
    await this.repo.save(order);
    return this.findOne(id);
  }
}
