import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { INotificationDispatcherPort } from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { UpsertConditionNotificationInput } from '@contexts/care-schedule/application/ports/upsert-condition-notification.input';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { UpsertConditionNotificationCommand } from '@contexts/notifications/application/commands/upsert-condition-notification/upsert-condition-notification.command';

@Injectable()
export class NotificationDispatcherAdapter implements INotificationDispatcherPort {
  private readonly logger = new Logger(NotificationDispatcherAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async dispatch(input: UpsertConditionNotificationInput): Promise<void> {
    this.logger.log(
      `Dispatching CARE_SCHEDULE_DUE=${input.active} for schedule ${input.referenceId}`,
    );

    await this.commandBus.execute(
      new UpsertConditionNotificationCommand({
        type: NotificationTypeEnum.CARE_SCHEDULE_DUE,
        referenceType: NotificationReferenceTypeEnum.CARE_SCHEDULE,
        referenceId: input.referenceId,
        payload: input.payload,
        active: input.active,
      }),
    );
  }
}
