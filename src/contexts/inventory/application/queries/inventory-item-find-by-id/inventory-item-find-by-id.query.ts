import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';

export type InventoryItemFindByIdQueryInput = Pick<
  IInventoryItemPrimitives,
  'id'
>;

export class InventoryItemFindByIdQuery {
  public readonly id: InventoryItemIdValueObject;

  constructor(input: InventoryItemFindByIdQueryInput) {
    this.id = new InventoryItemIdValueObject(input.id);
  }
}
