import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { INotificationDispatcherPort } from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { UpsertConditionNotificationInput } from '@contexts/care-schedule/application/ports/upsert-condition-notification.input';
import { UpsertConditionNotificationCommand } from '@contexts/notifications/application/commands/upsert-condition-notification/upsert-condition-notification.command';

/**
 * Anti-corruption layer: translates care-schedule's own vocabulary into the
 * wire-level strings notifications' public command expects. Deliberately
 * does NOT import notifications' domain enums (NotificationTypeEnum,
 * NotificationReferenceTypeEnum) — the command accepts plain strings
 * (Pick<INotificationPrimitives, 'type' | 'referenceType'> is `string`), so
 * care-schedule stays uncoupled from notifications' internal type shapes.
 */
const NOTIFICATION_TYPE_CARE_SCHEDULE_DUE = 'CARE_SCHEDULE_DUE';
const NOTIFICATION_REFERENCE_TYPE_CARE_SCHEDULE = 'CARE_SCHEDULE';

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
        type: NOTIFICATION_TYPE_CARE_SCHEDULE_DUE,
        referenceType: NOTIFICATION_REFERENCE_TYPE_CARE_SCHEDULE,
        referenceId: input.referenceId,
        payload: input.payload,
        active: input.active,
      }),
    );
  }
}
