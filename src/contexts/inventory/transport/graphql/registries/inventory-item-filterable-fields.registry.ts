import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';

export const inventoryItemFilterableFields: FilterFieldRegistry<InventoryItemQueryableField> =
  {
    [InventoryItemQueryableField.ID]: { type: 'uuid' },
    [InventoryItemQueryableField.ITEM_TYPE]: {
      type: 'enum',
      enum: InventoryItemTypeEnum,
    },
    [InventoryItemQueryableField.NAME]: { type: 'string' },
    [InventoryItemQueryableField.BRAND]: { type: 'string' },
    [InventoryItemQueryableField.NOTES]: { type: 'string' },
    [InventoryItemQueryableField.QUANTITY]: { type: 'number' },
    [InventoryItemQueryableField.UNIT]: {
      type: 'enum',
      enum: InventoryUnitEnum,
    },
    [InventoryItemQueryableField.LOW_STOCK_THRESHOLD]: { type: 'number' },
    [InventoryItemQueryableField.ACQUIRED_AT]: { type: 'date' },
    [InventoryItemQueryableField.EXPIRES_AT]: { type: 'date' },
    [InventoryItemQueryableField.USER_ID]: { type: 'uuid' },
    [InventoryItemQueryableField.CREATED_AT]: { type: 'date' },
    [InventoryItemQueryableField.UPDATED_AT]: { type: 'date' },
    [InventoryItemQueryableField.LOW_STOCK]: { type: 'boolean' },
  };
