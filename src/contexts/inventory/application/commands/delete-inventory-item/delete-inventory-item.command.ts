import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';

export type DeleteInventoryItemCommandInput = {
  id: string;
};

export class DeleteInventoryItemCommand {
  public readonly id: InventoryItemIdValueObject;

  constructor(input: DeleteInventoryItemCommandInput) {
    this.id = new InventoryItemIdValueObject(input.id);
  }
}
