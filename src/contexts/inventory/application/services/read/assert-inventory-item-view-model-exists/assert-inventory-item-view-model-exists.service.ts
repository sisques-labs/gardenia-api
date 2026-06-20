import { Inject, Injectable } from '@nestjs/common';

import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import {
  INVENTORY_ITEM_READ_REPOSITORY,
  IInventoryItemReadRepository,
} from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';

@Injectable()
export class AssertInventoryItemViewModelExistsService {
  constructor(
    @Inject(INVENTORY_ITEM_READ_REPOSITORY)
    private readonly inventoryItemReadRepository: IInventoryItemReadRepository,
  ) {}

  async execute(
    id: InventoryItemIdValueObject,
  ): Promise<InventoryItemViewModel> {
    const item = await this.inventoryItemReadRepository.findById(id.value);
    if (!item) throw new InventoryItemNotFoundException(id.value);
    return item;
  }
}
