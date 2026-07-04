import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit';

import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';

@InputType('InventoryItemSortInput')
export class InventoryItemSortInput extends createSortInput(
  InventoryItemQueryableField,
  'InventoryItem',
) {}
