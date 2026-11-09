import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';
import { NotificationService } from '../services/notification.service';
import { NotificationTriggersService } from '../services/notification-triggers.service';

/**
 * LIS notification history endpoints.
 *
 * Template management lives in the conversation service — LIS only records the
 * sender-app ledger of events it hands to conversation and can replay them.
 */
@ApiTags('lis')
@Controller('lis/notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly triggers: NotificationTriggersService,
  ) {}

  // ---------------------------------------------------------------- history

  @Get('history')
  @ApiOperation({
    summary:
      'Notification dispatch history — messages sent to the conversations module with delivery status',
  })
  async history(
    @Query('eventKey') eventKey: string | undefined,
    @Query('status') status: string | undefined,
    @Query('audience') audience: string | undefined,
    @Query('relatedEntityId') relatedEntityId: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.notifications.listDispatches(
      { eventKey, status, audience, relatedEntityId },
      tenantFromUser(user),
    );
    return { data: result.data, total: result.total };
  }

  /** Canonical path used by the LIS notification UI. */
  @Get('dispatches')
  @ApiOperation({
    summary: 'Notification dispatch ledger (alias of /history)',
  })
  async dispatches(
    @Query('eventKey') eventKey: string | undefined,
    @Query('status') status: string | undefined,
    @Query('audience') audience: string | undefined,
    @Query('relatedEntityId') relatedEntityId: string | undefined,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.notifications.listDispatches(
      { eventKey, status, audience, relatedEntityId },
      tenantFromUser(user),
    );
    return { data: result.data, total: result.total };
  }

  @Post('dispatches/:id/retrigger')
  @ApiOperation({ summary: 'Re-send a notification dispatch ledger entry' })
  async retrigger(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.notifications.retrigger(id, tenantFromUser(user));
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Get a dispatch ledger entry by id' })
  async historyEntry(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const { data } = await this.notifications.listDispatches(
      { relatedEntityId: id } as any,
      tenantFromUser(user),
    );
    return data[0] ?? null;
  }

  // ------------------------------------------------------------------ queue

  @Post('sync-delivery')
  @ApiOperation({ summary: 'Pull delivery statuses from the conversations module' })
  async syncDelivery() {
    await this.notifications.syncDeliveryStatus();
    return { ok: true };
  }

  @Post('retry-failed')
  @ApiOperation({ summary: 'Requeue failed dispatches (max 3 attempts)' })
  async retryFailed() {
    await this.notifications.retryFailed();
    return { ok: true };
  }
}
