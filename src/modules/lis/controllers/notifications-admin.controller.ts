import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';
import { OrderEntity, SampleEntity } from '../entities';
import { SamplesService } from '../services/samples.service';
import { NotificationTriggersService } from '../services/notification-triggers.service';

/**
 * Operational endpoints for firing notification triggers that don't have a
 * natural lifecycle hook yet (payment reminders) and for re-running the
 * sample-received trigger.
 */
@ApiTags('lis')
@Controller('lis/notifications/triggers')
export class NotificationTriggersController {
  constructor(
    private readonly triggers: NotificationTriggersService,
    private readonly samples: SamplesService,
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  @Post('sample-received/:sampleId')
  @ApiOperation({ summary: 'Fire the sample-received patient notification' })
  async sampleReceived(@Param('sampleId') sampleId: string, @CurrentUser() user: RequestUser) {
    const sample = (await this.samples.findOne(sampleId, tenantFromUser(user))) as SampleEntity;
    await this.triggers.sampleReceived(sample, tenantFromUser(user));
    return { ok: true };
  }

  @Post('payment-reminder')
  @ApiOperation({ summary: 'Fire a payment reminder for an order' })
  async paymentReminder(
    @Body() payload: { orderId: string; balanceDue: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!payload.orderId || !payload.balanceDue) {
      throw new BadRequestException('orderId and balanceDue are required');
    }
    const order = await this.orderRepo.findOne({
      where: { id: payload.orderId, deletedAt: undefined } as any,
    });
    if (!order) throw new BadRequestException('Order not found');
    await this.triggers.paymentReminder(order, payload.balanceDue, tenantFromUser(user));
    return { ok: true };
  }
}
