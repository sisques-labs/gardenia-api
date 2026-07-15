import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertNotificationExistsService } from '@contexts/notifications/application/services/write/assert-notification-exists/assert-notification-exists.service';
import { AssertNotificationOwnedByUserService } from '@contexts/notifications/application/services/write/assert-notification-owned-by-user/assert-notification-owned-by-user.service';
import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
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
    private readonly assertNotificationOwnedByUserService: AssertNotificationOwnedByUserService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const notification = await this.assertNotificationExistsService.execute(
      command.id,
    );

    this.assertNotificationOwnedByUserService.execute(
      notification,
      command.requestingUserId,
    );

    notification.markRead();

    await this.notificationWriteRepository.save(notification);
    await this.publishEvents(notification);

    this.logger.log(`Notification marked read: ${command.id.value}`);
  }
}
