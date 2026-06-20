import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';

import { UpdateInventoryItemCommand } from './update-inventory-item.command';

@CommandHandler(UpdateInventoryItemCommand)
export class UpdateInventoryItemCommandHandler
  extends BaseCommandHandler<UpdateInventoryItemCommand, InventoryItemAggregate>
  implements ICommandHandler<UpdateInventoryItemCommand, void>
{
  private readonly logger = new Logger(UpdateInventoryItemCommandHandler.name);

  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
    private readonly assertInventoryItemExistsService: AssertInventoryItemExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateInventoryItemCommand): Promise<void> {
    const item = await this.assertInventoryItemExistsService.execute(
      command.id,
    );

    item.update({
      itemType: command.itemType,
      name: command.name,
      brand: command.brand,
      notes: command.notes,
      unit: command.unit,
      lowStockThreshold: command.lowStockThreshold,
      acquiredAt: command.acquiredAt,
      expiresAt: command.expiresAt,
    });

    await this.inventoryItemWriteRepository.save(item);
    await this.publishEvents(item);

    this.logger.log(`Inventory item updated: ${command.id.value}`);
  }
}
