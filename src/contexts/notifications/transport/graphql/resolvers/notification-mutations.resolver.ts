import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { MarkAllNotificationsReadCommand } from '@contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.command';
import { MarkNotificationReadCommand } from '@contexts/notifications/application/commands/mark-notification-read/mark-notification-read.command';

@UseGuards(JwtAuthGuard)
@Resolver()
export class NotificationMutationsResolver {
  private readonly logger = new Logger(NotificationMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async notificationMarkRead(
    @Args('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `Marking notification read: ${id} for user: ${user.userId}`,
    );

    await this.commandBus.execute(
      new MarkNotificationReadCommand({
        id,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Notification marked as read',
      id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async notificationsMarkAllRead(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Marking all notifications read for user: ${user.userId}`);

    await this.commandBus.execute(
      new MarkAllNotificationsReadCommand(user.userId),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'All notifications marked as read',
    });
  }
}
