import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { FindAllExpiringInventoryItemsService } from '@contexts/inventory/application/services/read/find-all-expiring-inventory-items/find-all-expiring-inventory-items.service';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { runWithConcurrency } from '@shared/concurrency/run-with-concurrency.util';
import { MS_PER_DAY } from '@shared/time/time.constants';

import { CheckExpiringInventoryItemsCommand } from './check-expiring-inventory-items.command';

const DISPATCH_CONCURRENCY = 10;

@CommandHandler(CheckExpiringInventoryItemsCommand)
export class CheckExpiringInventoryItemsCommandHandler implements ICommandHandler<
  CheckExpiringInventoryItemsCommand,
  void
> {
  private readonly logger = new Logger(
    CheckExpiringInventoryItemsCommandHandler.name,
  );

  constructor(
    private readonly findAllExpiringInventoryItemsService: FindAllExpiringInventoryItemsService,
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
  ) {}

  async execute(command: CheckExpiringInventoryItemsCommand): Promise<void> {
    const expiringBefore = new Date(
      Date.now() + command.windowDays.value * MS_PER_DAY,
    );
    const items = await this.findAllExpiringInventoryItemsService.execute({
      expiringBefore,
    });

    await runWithConcurrency(
      items,
      (item) =>
        this.notificationDispatcherPort.dispatch({
          condition: InventoryNotificationConditionEnum.EXPIRING_SOON,
          referenceId: item.id,
          payload: {
            itemName: item.name,
            itemType: item.itemType,
            expiresAt: item.expiresAt,
          },
          active: true,
        }),
      DISPATCH_CONCURRENCY,
    );

    this.logger.log(
      `Checked expiring inventory items within ${command.windowDays.value}d: ${items.length} expiring`,
    );
  }
}
