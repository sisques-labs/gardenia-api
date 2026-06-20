import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';

export type DeleteInventoryItemCommandInput = Pick<
  IInventoryItemPrimitives,
  'id'
>;

export class DeleteInventoryItemCommand {
  public readonly id: InventoryItemIdValueObject;

  constructor(input: DeleteInventoryItemCommandInput) {
    this.id = new InventoryItemIdValueObject(input.id);
  }
}
