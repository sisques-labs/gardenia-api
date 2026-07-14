import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertNotificationExistsService } from '@contexts/notifications/application/services/write/assert-notification-exists/assert-notification-exists.service';
import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationNotOwnedException } from '@contexts/notifications/domain/exceptions/notification-not-owned.exception';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';

import { MarkNotificationReadCommand } from './mark-notification-read.command';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadCommandHandler
  extends BaseCommandHandler<MarkNotificationReadCommand, NotificationAggregate>
  implements ICommandHandler<MarkNotificationReadCommand, void>
{
  private readonly logger = new Logger(MarkNotificationReadCommandHandler.name);

  constructor(
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
    private readonly assertNotificationExistsService: AssertNotificationExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const notification = await this.assertNotificationExistsService.execute(
      command.id,
    );

    if (notification.userId.value !== command.requestingUserId.value) {
      throw new NotificationNotOwnedException(command.id.value);
    }

    notification.markRead();

    await this.notificationWriteRepository.save(notification);
    await this.publishEvents(notification);

    this.logger.log(`Notification marked read: ${command.id.value}`);
  }
}
