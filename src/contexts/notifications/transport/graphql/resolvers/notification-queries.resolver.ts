import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { NotificationFindByCriteriaQuery } from '@contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.query';
import { NotificationsUnreadCountQuery } from '@contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.query';
import { notificationFilterableFields } from '@contexts/notifications/transport/graphql/registries/notification-filterable-fields.registry';
import { NotificationCriteriaGraphQLDto } from '@contexts/notifications/transport/graphql/dtos/requests/notification-criteria-graphql.dto';
import { PaginatedNotificationsResultDto } from '@contexts/notifications/transport/graphql/dtos/responses/notification.response.dto';
import { NotificationGraphQLMapper } from '@contexts/notifications/transport/graphql/mappers/notification.mapper';

@UseGuards(JwtAuthGuard)
@Resolver()
export class NotificationQueriesResolver {
  private readonly logger = new Logger(NotificationQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly notificationGraphQLMapper: NotificationGraphQLMapper,
  ) {}

  @Query(() => PaginatedNotificationsResultDto)
  async notificationsFindByCriteria(
    @CurrentUser() user: CurrentUserPayload,
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(notificationFilterableFields),
    )
    input?: NotificationCriteriaGraphQLDto,
  ): Promise<PaginatedNotificationsResultDto> {
    this.logger.log(
      `Finding notifications by criteria for user: ${user.userId}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new NotificationFindByCriteriaQuery(user.userId, criteria),
    );

    return this.notificationGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => Number)
  async notificationsUnreadCount(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<number> {
    this.logger.log(`Counting unread notifications for user: ${user.userId}`);
    return this.queryBus.execute(
      new NotificationsUnreadCountQuery(user.userId),
    );
  }
}
