import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';

export interface DispatchInventoryLowStockNotificationServiceInput {
  item: InventoryItemAggregate;
  active?: boolean;
}

/**
 * Single place that knows how to tell notifications whether an item is
 * currently low on stock. Shared by every inventory mutation handler that
 * can change the quantity/threshold (adjust-quantity/update/delete) so the
 * payload shape lives in exactly one spot.
 */
@Injectable()
export class DispatchInventoryLowStockNotificationService implements IBaseService<
  DispatchInventoryLowStockNotificationServiceInput,
  void
> {
  constructor(
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
  ) {}

  async execute(
    input: DispatchInventoryLowStockNotificationServiceInput,
  ): Promise<void> {
    const { item } = input;

    await this.notificationDispatcherPort.dispatch({
      condition: InventoryNotificationConditionEnum.LOW_STOCK,
      referenceId: item.id.value,
      payload: {
        itemName: item.name.value,
        itemType: item.itemType.value,
        quantity: item.quantity.value,
        unit: item.unit.value,
        lowStockThreshold: item.lowStockThreshold?.value ?? null,
      },
      active: input.active ?? item.isLowStock(),
    });
  }
}
