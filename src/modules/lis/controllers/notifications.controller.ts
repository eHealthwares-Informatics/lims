import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';
import { NotificationService } from '../services/notification.service';
import { NotificationTriggersService } from '../services/notification-triggers.service';

/**
 * Notification engine endpoints (#107 BE engine, #113 history data):
 * - Template CRUD/configuration
 * - Dispatch history (sender-app ledger of messages sent through the
 *   conversations module, with delivery status)
 * - Manual re-emit / delivery-status sync
 */
@ApiTags('lis')
@Controller('lis/notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly triggers: NotificationTriggersService,
  ) {}

  // ---------------------------------------------------------------- templates

  @Get('templates')
  @ApiOperation({ summary: 'List notification templates' })
  async templates(@Query('eventKey') eventKey: string | undefined, @CurrentUser() user: RequestUser) {
    const data = await this.notifications.listTemplates(tenantFromUser(user), eventKey);
    return { data };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create or update a notification template' })
  async upsertTemplate(
    @Body()
    payload: {
      templateCode: string;
      eventKey: string;
      audience: 'PATIENT' | 'DOCTOR' | 'LAB';
      channels?: string;
      body: string;
      language?: string;
      channelCodeOverride?: string;
      active?: boolean;
    },
    @CurrentUser() user: RequestUser,
  ) {
    const tenant = tenantFromUser(user);
    const created = await this.notifications.upsertTemplate({
      ...payload,
      organizationId: tenant?.organizationId ?? null,
      locationId: tenant?.locationId ?? null,
    } as any);
    return created;
  }

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
