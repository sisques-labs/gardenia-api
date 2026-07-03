import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';

export interface DeleteInventoryItemsBulkCommandInput {
  ids: string[];
}

export class DeleteInventoryItemsBulkCommand {
  public readonly ids: InventoryItemIdValueObject[];

  constructor(input: DeleteInventoryItemsBulkCommandInput) {
    this.ids = [...new Set(input.ids)].map(
      (id) => new InventoryItemIdValueObject(id),
    );
  }
}
