import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';

export const INVENTORY_ITEM_WRITE_REPOSITORY = Symbol(
  'INVENTORY_ITEM_WRITE_REPOSITORY',
);

export type IInventoryItemWriteRepository =
  IBaseWriteRepository<InventoryItemAggregate>;
