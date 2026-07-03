import { FilterOperator, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';
import { inventoryItemFilterableFields } from '@contexts/inventory/transport/graphql/registries/inventory-item-filterable-fields.registry';

describe('inventoryItemFilterableFields', () => {
  const pipe = new FilterValidationPipe(inventoryItemFilterableFields);

  it('has an entry for every InventoryItemQueryableField value', () => {
    for (const field of Object.values(InventoryItemQueryableField)) {
      expect(inventoryItemFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on itemType with a real enum value', () => {
    const input = {
      filters: [
        {
          field: InventoryItemQueryableField.ITEM_TYPE,
          operator: FilterOperator.EQUALS,
          value: InventoryItemTypeEnum.SEEDS,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects an itemType value outside the enum', () => {
    const input = {
      filters: [
        {
          field: InventoryItemQueryableField.ITEM_TYPE,
          operator: FilterOperator.EQUALS,
          value: 'TOOLS',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
  });

  it('accepts the virtual low_stock boolean filter', () => {
    const input = {
      filters: [
        {
          field: InventoryItemQueryableField.LOW_STOCK,
          operator: FilterOperator.EQUALS,
          value: true,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a filter on a field outside the whitelist (e.g. spaceId)', () => {
    const input = {
      filters: [
        { field: 'spaceId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });
});
