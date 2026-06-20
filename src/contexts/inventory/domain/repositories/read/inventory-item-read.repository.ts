import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';

export const INVENTORY_ITEM_READ_REPOSITORY = Symbol(
  'INVENTORY_ITEM_READ_REPOSITORY',
);

export type IInventoryItemReadRepository =
  IBaseReadRepository<InventoryItemViewModel>;
