import { Inject, Injectable } from '@nestjs/common';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';

@Injectable()
export class AssertInventoryItemExistsService {
  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
  ) {}

  async execute(
    id: InventoryItemIdValueObject,
  ): Promise<InventoryItemAggregate> {
    const item = await this.inventoryItemWriteRepository.findById(id.value);
    if (!item) throw new InventoryItemNotFoundException(id.value);
    return item;
  }
}
