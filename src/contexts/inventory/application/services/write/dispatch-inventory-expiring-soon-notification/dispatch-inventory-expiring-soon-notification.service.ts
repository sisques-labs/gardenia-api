import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { IInventoryConfig } from '@core/config/inventory.config';

/**
 * Single place that knows how to tell notifications whether an item is
 * currently expiring soon. Shared by every inventory mutation handler that
 * can change expiresAt (update/delete) and by the expiring-soon cron so the
 * payload shape and the expiringWindowDays lookup live in exactly one spot.
 */
@Injectable()
export class DispatchInventoryExpiringSoonNotificationService {
  constructor(
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
    private readonly configService: ConfigService,
  ) {}

  async dispatch(
    item: InventoryItemAggregate,
    active?: boolean,
  ): Promise<void> {
    await this.notificationDispatcherPort.dispatch({
      condition: InventoryNotificationConditionEnum.EXPIRING_SOON,
      referenceId: item.id.value,
      payload: {
        itemName: item.name.value,
        itemType: item.itemType.value,
        expiresAt: item.expiresAt?.value ?? null,
      },
      active: active ?? this.isExpiring(item),
    });
  }

  private isExpiring(item: InventoryItemAggregate): boolean {
    const { expiringWindowDays } =
      this.configService.getOrThrow<IInventoryConfig>('inventory');
    return item.isExpiringWithin(expiringWindowDays);
  }
}
