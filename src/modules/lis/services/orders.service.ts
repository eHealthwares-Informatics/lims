import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { StatusesService } from './statuses.service';
import { StatusHistoryService } from './status-history.service';
import { CreateOrderDto } from '../dto/order.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class OrdersService extends BaseLisService<OrderEntity> {
  constructor(
    @InjectRepository(OrderEntity) repo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItemRepo: Repository<OrderItemEntity>,
    private readonly codes: CodeGeneratorService,
    private readonly statuses: StatusesService,
    private readonly statusHistory: StatusHistoryService,
  ) {
    super(repo, 'orders');
  }

  protected searchColumns(): string[] {
    return ['orderNumber', 'patientId', 'patientName'];
  }

  protected relations(): string[] {
    return ['priority', 'statusRef', 'items', 'items.testDefinition'];
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

  async create(payload: CreateOrderDto, tenant?: TenantContext): Promise<any> {
    const orderNumber = this.codes.generate('orders', `ORD-${Date.now()}`);
    const initialStatus = await this.statuses.findByCode('ENTERED');
    const order = await this.repo.save(
      this.repo.create({
        orderNumber,
        patientId: payload.patientId,
        internalReference: payload.internalReference ?? null,
        externalReference: payload.externalReference ?? null,
        patientName: payload.patientName,
        patientAge: payload.patientAge ?? null,
        patientGender: payload.patientGender ?? null,
        patientDateOfBirth: payload.patientDateOfBirth ?? null,
        priorityId: payload.priorityId ?? null,
        requestedDate: payload.requestedDate ?? null,
        notes: payload.notes ?? null,
        status: 'ENTERED',
        statusId: initialStatus?.id ?? null,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
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
    if (initialStatus) {
      await this.statusHistory.record('Order', order.id, initialStatus.id, null, null, 'Order created');
    }
    return this.findOne(order.id);
  }

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const order = await this.findOne(id, tenant);
    if (payload.status) order.status = payload.status as string;
    if (payload.patientName) order.patientName = payload.patientName as string;
    if (payload.patientAge !== undefined) order.patientAge = payload.patientAge as number | null;
    if (payload.patientGender !== undefined) order.patientGender = payload.patientGender as string | null;
    if (payload.patientDateOfBirth !== undefined) order.patientDateOfBirth = payload.patientDateOfBirth as string | null;
    if (payload.internalReference !== undefined) order.internalReference = payload.internalReference as string | null;
    if (payload.externalReference !== undefined) order.externalReference = payload.externalReference as string | null;
    if (payload.collectedDate !== undefined) order.collectedDate = payload.collectedDate as string | null;
    if (payload.completedDate !== undefined) order.completedDate = payload.completedDate as string | null;
    if (payload.notes !== undefined) order.notes = payload.notes as string | null;
    await this.repo.save(order);
    return this.findOne(id, tenant);
  }

  async transitionStatus(id: string, toStatusId: string, tenant?: TenantContext, userId?: string, reason?: string): Promise<any> {
    const order = await this.findOne(id, tenant);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const toStatus = await this.statuses.findOne(toStatusId);
    const fromCode = order.status;
    const toCode = toStatus.code;
    if (!this.statuses.validateTransition('ORDER', fromCode, toCode)) {
      throw new BadRequestException(`Invalid transition from "${fromCode}" to "${toCode}"`);
    }
    order.status = toCode;
    order.statusId = toStatusId;
    if (toCode === 'COMPLETED') order.completedDate = new Date().toISOString().split('T')[0];
    await this.repo.save(order);
    await this.statusHistory.record('Order', id, toStatusId, order.statusId, userId ?? null, reason ?? null);
    return this.findOne(id, tenant);
  }
}
