import { registerEnumType } from '@nestjs/graphql';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

registerEnumType(InventoryItemTypeEnum, {
  name: 'InventoryItemTypeEnum',
  description: 'Type of a consumable inventory item',
});

registerEnumType(InventoryUnitEnum, {
  name: 'InventoryUnitEnum',
  description: 'Unit of measurement for an inventory item',
});
