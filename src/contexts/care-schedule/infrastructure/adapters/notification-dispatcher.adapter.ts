import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { INotificationDispatcherPort } from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { UpsertConditionNotificationInput } from '@contexts/care-schedule/application/ports/upsert-condition-notification.input';
import { CareScheduleNotificationTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-notification-type.enum';
import { UpsertConditionNotificationCommand } from '@contexts/notifications/application/commands/upsert-condition-notification/upsert-condition-notification.command';

/**
 * Anti-corruption layer: translates care-schedule's own vocabulary
 * (CareScheduleNotificationTypeEnum) into the wire-level strings
 * notifications' public command expects. notifications' `type`/
 * `referenceType` are plain strings with no closed enum on that side either
 * — the set of possible values is defined by source contexts like this one,
 * not by notifications.
 */
const NOTIFICATION_TYPE_TO_WIRE: Record<
  CareScheduleNotificationTypeEnum,
  string
> = {
  [CareScheduleNotificationTypeEnum.DUE]: 'CARE_SCHEDULE_DUE',
};

const NOTIFICATION_REFERENCE_TYPE_CARE_SCHEDULE = 'CARE_SCHEDULE';

@Injectable()
export class NotificationDispatcherAdapter implements INotificationDispatcherPort {
  private readonly logger = new Logger(NotificationDispatcherAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async dispatch(input: UpsertConditionNotificationInput): Promise<void> {
    this.logger.log(
      `Dispatching ${input.type}=${input.active} for schedule ${input.referenceId}`,
    );

    await this.commandBus.execute(
      new UpsertConditionNotificationCommand({
        type: NOTIFICATION_TYPE_TO_WIRE[input.type],
        referenceType: NOTIFICATION_REFERENCE_TYPE_CARE_SCHEDULE,
        referenceId: input.referenceId,
        payload: input.payload,
        active: input.active,
      }),
    );
  }
}
