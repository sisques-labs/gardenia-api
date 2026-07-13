import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';

import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';

@CommandHandler(MarkAllNotificationsReadCommand)
export class MarkAllNotificationsReadCommandHandler
  extends BaseCommandHandler<
    MarkAllNotificationsReadCommand,
    NotificationAggregate
  >
  implements ICommandHandler<MarkAllNotificationsReadCommand, void>
{
  private readonly logger = new Logger(
    MarkAllNotificationsReadCommandHandler.name,
  );

  constructor(
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: MarkAllNotificationsReadCommand): Promise<void> {
    const notifications =
      await this.notificationWriteRepository.findUnreadByUserId(
        command.userId.value,
      );

    notifications.forEach((notification) => notification.markRead());

    await this.notificationWriteRepository.saveMany(notifications);
    for (const notification of notifications) {
      await this.publishEvents(notification);
    }

    this.logger.log(
      `Marked ${notifications.length} notifications read for user: ${command.userId.value}`,
    );
  }
}
