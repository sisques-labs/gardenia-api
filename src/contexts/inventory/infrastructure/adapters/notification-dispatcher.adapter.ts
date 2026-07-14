import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { INotificationDispatcherPort } from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { UpsertConditionNotificationInput } from '@contexts/inventory/application/ports/upsert-condition-notification.input';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { UpsertConditionNotificationCommand } from '@contexts/notifications/application/commands/upsert-condition-notification/upsert-condition-notification.command';

const CONDITION_TO_TYPE: Record<
  InventoryNotificationConditionEnum,
  NotificationTypeEnum
> = {
  [InventoryNotificationConditionEnum.LOW_STOCK]:
    NotificationTypeEnum.INVENTORY_LOW_STOCK,
  [InventoryNotificationConditionEnum.EXPIRING_SOON]:
    NotificationTypeEnum.INVENTORY_EXPIRING_SOON,
};

@Injectable()
export class NotificationDispatcherAdapter implements INotificationDispatcherPort {
  private readonly logger = new Logger(NotificationDispatcherAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async dispatch(input: UpsertConditionNotificationInput): Promise<void> {
    this.logger.log(
      `Dispatching ${input.condition}=${input.active} for item ${input.referenceId}`,
    );

    await this.commandBus.execute(
      new UpsertConditionNotificationCommand({
        type: CONDITION_TO_TYPE[input.condition],
        referenceType: NotificationReferenceTypeEnum.INVENTORY_ITEM,
        referenceId: input.referenceId,
        payload: input.payload,
        active: input.active,
      }),
    );
  }
}
