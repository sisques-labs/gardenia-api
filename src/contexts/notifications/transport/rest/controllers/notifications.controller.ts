import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Criteria,
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { MarkAllNotificationsReadCommand } from '@contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.command';
import { MarkNotificationReadCommand } from '@contexts/notifications/application/commands/mark-notification-read/mark-notification-read.command';
import { NotificationFindByCriteriaQuery } from '@contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.query';
import { NotificationsUnreadCountQuery } from '@contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.query';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import { NotificationRestResponseDto } from '../dtos/notification-rest-response.dto';
import { NotificationRestMapper } from '../mappers/notification/notification.mapper';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly notificationRestMapper: NotificationRestMapper,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List the current user's notifications" })
  @ApiResponse({ status: 200 })
  async notificationsFindByCriteria(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: NotificationStatusEnum,
    @Query('type') type?: NotificationTypeEnum,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResult<NotificationRestResponseDto>> {
    this.logger.log(`GET /notifications by user: ${user.userId}`);

    const filters: Filter[] = [];
    if (status)
      filters.push({
        field: 'status',
        operator: FilterOperator.EQUALS,
        value: status,
      });
    if (type)
      filters.push({
        field: 'type',
        operator: FilterOperator.EQUALS,
        value: type,
      });

    const pagination =
      page || limit
        ? { page: page ? Number(page) : 1, perPage: limit ? Number(limit) : 20 }
        : undefined;

    const result = await this.queryBus.execute<
      NotificationFindByCriteriaQuery,
      PaginatedResult<NotificationViewModel>
    >(
      new NotificationFindByCriteriaQuery(
        user.userId,
        new Criteria(filters, undefined, pagination),
      ),
    );

    return {
      items: result.items.map((vm) =>
        this.notificationRestMapper.toResponse(vm),
      ),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Count the current user's unread notifications" })
  @ApiResponse({ status: 200 })
  async notificationsUnreadCount(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ count: number }> {
    this.logger.log(`GET /notifications/unread-count by user: ${user.userId}`);
    const count = await this.queryBus.execute<
      NotificationsUnreadCountQuery,
      number
    >(new NotificationsUnreadCountQuery(user.userId));
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  @ApiResponse({ status: 403, description: 'Not owned by the current user' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markNotificationRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ success: boolean }> {
    this.logger.log(`PATCH /notifications/${id}/read by user: ${user.userId}`);
    await this.commandBus.execute(
      new MarkNotificationReadCommand({
        notificationId: id,
        userId: user.userId,
      }),
    );
    return { success: true };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Mark all of the current user's notifications as read",
  })
  @ApiResponse({ status: 200, description: 'All marked as read' })
  async markAllNotificationsRead(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ success: boolean }> {
    this.logger.log(`POST /notifications/read-all by user: ${user.userId}`);
    await this.commandBus.execute(
      new MarkAllNotificationsReadCommand(user.userId),
    );
    return { success: true };
  }
}
