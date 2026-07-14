import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { DispatchInventoryExpiringSoonNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-expiring-soon-notification/dispatch-inventory-expiring-soon-notification.service';
import { DispatchInventoryLowStockNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-low-stock-notification/dispatch-inventory-low-stock-notification.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';

import { DeleteInventoryItemCommand } from './delete-inventory-item.command';

@CommandHandler(DeleteInventoryItemCommand)
export class DeleteInventoryItemCommandHandler
  extends BaseCommandHandler<DeleteInventoryItemCommand, InventoryItemAggregate>
  implements ICommandHandler<DeleteInventoryItemCommand, void>
{
  private readonly logger = new Logger(DeleteInventoryItemCommandHandler.name);

  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
    private readonly assertInventoryItemExistsService: AssertInventoryItemExistsService,
    private readonly dispatchInventoryLowStockNotificationService: DispatchInventoryLowStockNotificationService,
    private readonly dispatchInventoryExpiringSoonNotificationService: DispatchInventoryExpiringSoonNotificationService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteInventoryItemCommand): Promise<void> {
    const item = await this.assertInventoryItemExistsService.execute(
      command.id,
    );

    item.delete();

    await this.inventoryItemWriteRepository.delete(item.id.value);
    await this.publishEvents(item);

    this.logger.log(`Inventory item deleted: ${command.id.value}`);

    await this.dispatchInventoryLowStockNotificationService.dispatch(
      item,
      false,
    );
    await this.dispatchInventoryExpiringSoonNotificationService.dispatch(
      item,
      false,
    );
  }
}
