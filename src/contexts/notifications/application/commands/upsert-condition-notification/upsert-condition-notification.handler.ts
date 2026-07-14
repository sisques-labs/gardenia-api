import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { OpenNotificationService } from '@contexts/notifications/application/services/write/open-notification/open-notification.service';
import { ResolveNotificationsService } from '@contexts/notifications/application/services/write/resolve-notifications/resolve-notifications.service';
import {
  NOTIFICATION_READ_REPOSITORY,
  INotificationReadRepository,
} from '@contexts/notifications/domain/repositories/read/notification-read.repository';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { UpsertConditionNotificationCommand } from './upsert-condition-notification.command';

@CommandHandler(UpsertConditionNotificationCommand)
export class UpsertConditionNotificationCommandHandler implements ICommandHandler<
  UpsertConditionNotificationCommand,
  void
> {
  constructor(
    @Inject(NOTIFICATION_READ_REPOSITORY)
    private readonly notificationReadRepository: INotificationReadRepository,
    private readonly openNotificationService: OpenNotificationService,
    private readonly resolveNotificationsService: ResolveNotificationsService,
    private readonly spaceContext: SpaceContext,
  ) {}

  async execute(command: UpsertConditionNotificationCommand): Promise<void> {
    const spaceId = this.spaceContext.require();
    const dedupeKey = NotificationDedupeKeyValueObject.compute(
      command.type.value,
      command.referenceId.value,
    );

    const open =
      await this.notificationReadRepository.findOpenByDedupeKey(dedupeKey);

    if (command.active.value) {
      if (open.length === 0) {
        await this.openNotificationService.execute({
          type: command.type.value,
          referenceType: command.referenceType.value,
          referenceId: command.referenceId.value,
          payload: command.payload.value,
          spaceId,
        });
      }
      return;
    }

    await this.resolveNotificationsService.execute({ open, dedupeKey });
  }
}
