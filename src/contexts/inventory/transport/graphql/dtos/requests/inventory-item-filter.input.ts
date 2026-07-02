import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit';

import { InventoryItemQueryableField } from '@contexts/inventory/transport/graphql/enums/inventory-item-queryable-field.enum';

@InputType('InventoryItemFilterInput')
export class InventoryItemFilterInput extends createFilterInput(
  InventoryItemQueryableField,
  'InventoryItem',
) {}
