import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import {
  INVENTORY_ITEM_READ_REPOSITORY,
  IInventoryItemReadRepository,
} from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';

import { CheckExpiringInventoryItemsCommand } from './check-expiring-inventory-items.command';

const PAGE_SIZE = 100;

@CommandHandler(CheckExpiringInventoryItemsCommand)
export class CheckExpiringInventoryItemsCommandHandler implements ICommandHandler<
  CheckExpiringInventoryItemsCommand,
  void
> {
  private readonly logger = new Logger(
    CheckExpiringInventoryItemsCommandHandler.name,
  );

  constructor(
    @Inject(INVENTORY_ITEM_READ_REPOSITORY)
    private readonly inventoryItemReadRepository: IInventoryItemReadRepository,
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
  ) {}

  async execute(command: CheckExpiringInventoryItemsCommand): Promise<void> {
    const expiringBefore = new Date(
      Date.now() + command.windowDays.value * 24 * 60 * 60 * 1000,
    );
    const items = await this.fetchAllExpiring(expiringBefore);

    for (const item of items) {
      await this.notificationDispatcherPort.dispatch({
        condition: InventoryNotificationConditionEnum.EXPIRING_SOON,
        referenceId: item.id,
        payload: {
          itemName: item.name,
          itemType: item.itemType,
          expiresAt: item.expiresAt,
        },
        active: true,
      });
    }

    this.logger.log(
      `Checked expiring inventory items within ${command.windowDays.value}d: ${items.length} expiring`,
    );
  }

  private async fetchAllExpiring(
    expiringBefore: Date,
  ): Promise<InventoryItemViewModel[]> {
    const results: InventoryItemViewModel[] = [];
    let page = 1;

    for (;;) {
      const criteria = new Criteria(
        [
          {
            field: InventoryItemQueryableField.EXPIRES_AT,
            operator: FilterOperator.LESS_THAN_OR_EQUAL,
            value: expiringBefore.toISOString(),
          },
        ],
        undefined,
        { page, perPage: PAGE_SIZE },
      );

      const result: PaginatedResult<InventoryItemViewModel> =
        await this.inventoryItemReadRepository.findByCriteria(criteria);
      results.push(...result.items);

      if (result.items.length < PAGE_SIZE) break;
      page += 1;
    }

    return results;
  }
}
