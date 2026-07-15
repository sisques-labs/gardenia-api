import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { INotificationDispatcherPort } from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { UpsertConditionNotificationInput } from '@contexts/inventory/application/ports/upsert-condition-notification.input';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { UpsertConditionNotificationCommand } from '@contexts/notifications/application/commands/upsert-condition-notification/upsert-condition-notification.command';

/**
 * Anti-corruption layer: translates inventory's own vocabulary into the
 * wire-level strings notifications' public command expects. notifications'
 * `type`/`referenceType` are plain strings with no closed enum on that side
 * either — the set of possible values is defined by source contexts like
 * this one, not by notifications.
 */
const CONDITION_TO_NOTIFICATION_TYPE: Record<
  InventoryNotificationConditionEnum,
  string
> = {
  [InventoryNotificationConditionEnum.LOW_STOCK]: 'INVENTORY_LOW_STOCK',
  [InventoryNotificationConditionEnum.EXPIRING_SOON]: 'INVENTORY_EXPIRING_SOON',
};

const NOTIFICATION_REFERENCE_TYPE_INVENTORY_ITEM = 'INVENTORY_ITEM';

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
        type: CONDITION_TO_NOTIFICATION_TYPE[input.condition],
        referenceType: NOTIFICATION_REFERENCE_TYPE_INVENTORY_ITEM,
        referenceId: input.referenceId,
        payload: input.payload,
        active: input.active,
      }),
    );
  }
}
