import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemBuilder } from '@contexts/inventory/domain/builders/inventory-item.builder';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';

import { CreateInventoryItemCommand } from './create-inventory-item.command';

@CommandHandler(CreateInventoryItemCommand)
export class CreateInventoryItemCommandHandler
  extends BaseCommandHandler<CreateInventoryItemCommand, InventoryItemAggregate>
  implements ICommandHandler<CreateInventoryItemCommand, string>
{
  private readonly logger = new Logger(CreateInventoryItemCommandHandler.name);

  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
    private readonly inventoryItemBuilder: InventoryItemBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateInventoryItemCommand): Promise<string> {
    const now = new Date();
    const inventoryItemId = UuidValueObject.generate().value;

    const item = this.inventoryItemBuilder
      .withId(inventoryItemId)
      .withItemType(command.itemType.value)
      .withName(command.name.value)
      .withBrand(command.brand?.value ?? null)
      .withNotes(command.notes?.value ?? null)
      .withQuantity(command.quantity.value)
      .withUnit(command.unit.value)
      .withLowStockThreshold(command.lowStockThreshold?.value ?? null)
      .withAcquiredAt(command.acquiredAt?.value ?? null)
      .withExpiresAt(command.expiresAt?.value ?? null)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    item.create();

    await this.inventoryItemWriteRepository.save(item);
    await this.publishEvents(item);

    this.logger.log(
      `Inventory item created: ${item.id.value} by user: ${command.userId.value}`,
    );

    return item.id.value;
  }
}
