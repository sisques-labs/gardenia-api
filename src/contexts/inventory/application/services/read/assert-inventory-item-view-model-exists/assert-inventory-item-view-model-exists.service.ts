import { Inject, Injectable } from '@nestjs/common';

import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import {
  INVENTORY_ITEM_READ_REPOSITORY,
  IInventoryItemReadRepository,
} from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';

import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertInventoryItemViewModelExistsService {
  constructor(
    @Inject(INVENTORY_ITEM_READ_REPOSITORY)
    private readonly inventoryItemReadRepository: IInventoryItemReadRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<InventoryItemViewModel> {
    const item = await this.inventoryItemReadRepository.findById(id.value);
    if (!item) throw new InventoryItemNotFoundException(id.value);
    return item;
  }
}
