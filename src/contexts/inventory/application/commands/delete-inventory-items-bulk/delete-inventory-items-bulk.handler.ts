import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { DispatchInventoryExpiringSoonNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-expiring-soon-notification/dispatch-inventory-expiring-soon-notification.service';
import { DispatchInventoryLowStockNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-low-stock-notification/dispatch-inventory-low-stock-notification.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';

import { DeleteInventoryItemsBulkCommand } from './delete-inventory-items-bulk.command';

export interface DeleteInventoryItemsBulkResult {
  deletedIds: string[];
  notFoundIds: string[];
}

@CommandHandler(DeleteInventoryItemsBulkCommand)
export class DeleteInventoryItemsBulkCommandHandler
  extends BaseCommandHandler<
    DeleteInventoryItemsBulkCommand,
    InventoryItemAggregate
  >
  implements
    ICommandHandler<
      DeleteInventoryItemsBulkCommand,
      DeleteInventoryItemsBulkResult
    >
{
  private readonly logger = new Logger(
    DeleteInventoryItemsBulkCommandHandler.name,
  );

  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
    private readonly dispatchInventoryLowStockNotificationService: DispatchInventoryLowStockNotificationService,
    private readonly dispatchInventoryExpiringSoonNotificationService: DispatchInventoryExpiringSoonNotificationService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: DeleteInventoryItemsBulkCommand,
  ): Promise<DeleteInventoryItemsBulkResult> {
    this.logger.log(`Bulk deleting ${command.ids.length} inventory items`);

    const deletedIds: string[] = [];
    const notFoundIds: string[] = [];

    for (const id of command.ids) {
      const item = await this.inventoryItemWriteRepository.findById(id.value);

      if (!item) {
        notFoundIds.push(id.value);
        continue;
      }

      item.delete();
      await this.inventoryItemWriteRepository.delete(item.id.value);
      await this.publishEvents(item);
      deletedIds.push(item.id.value);

      await this.dispatchInventoryLowStockNotificationService.dispatch(
        item,
        false,
      );
      await this.dispatchInventoryExpiringSoonNotificationService.dispatch(
        item,
        false,
      );
    }

    this.logger.log(
      `Bulk delete complete: ${deletedIds.length} deleted, ${notFoundIds.length} not found`,
    );

    return { deletedIds, notFoundIds };
  }
}
