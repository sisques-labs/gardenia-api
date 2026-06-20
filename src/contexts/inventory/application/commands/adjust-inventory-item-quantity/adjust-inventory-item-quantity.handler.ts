import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';

import { AdjustInventoryItemQuantityCommand } from './adjust-inventory-item-quantity.command';

@CommandHandler(AdjustInventoryItemQuantityCommand)
export class AdjustInventoryItemQuantityCommandHandler
  extends BaseCommandHandler<
    AdjustInventoryItemQuantityCommand,
    InventoryItemAggregate
  >
  implements ICommandHandler<AdjustInventoryItemQuantityCommand, void>
{
  private readonly logger = new Logger(
    AdjustInventoryItemQuantityCommandHandler.name,
  );

  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
    private readonly assertInventoryItemExistsService: AssertInventoryItemExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: AdjustInventoryItemQuantityCommand): Promise<void> {
    const item = await this.assertInventoryItemExistsService.execute(
      command.id,
    );

    item.adjustQuantity(command.delta, command.reason.value);

    await this.inventoryItemWriteRepository.save(item);
    await this.publishEvents(item);

    this.logger.log(
      `Inventory item quantity adjusted: ${command.id.value} delta: ${command.delta}`,
    );
  }
}
