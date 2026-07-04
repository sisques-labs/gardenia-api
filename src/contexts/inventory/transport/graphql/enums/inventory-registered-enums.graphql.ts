import { registerEnumType } from '@nestjs/graphql';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';

registerEnumType(InventoryItemTypeEnum, {
  name: 'InventoryItemTypeEnum',
  description: 'Type of a consumable inventory item',
});

registerEnumType(InventoryUnitEnum, {
  name: 'InventoryUnitEnum',
  description: 'Unit of measurement for an inventory item',
});

registerEnumType(InventoryItemQueryableField, {
  name: 'InventoryItemQueryableFieldEnum',
  description: 'The inventory item fields that can be filtered/sorted on',
});
