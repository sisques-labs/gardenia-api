import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type DeleteInventoryItemCommandInput = Pick<
  IInventoryItemPrimitives,
  'id'
>;

export class DeleteInventoryItemCommand {
  public readonly id: UuidValueObject;

  constructor(input: DeleteInventoryItemCommandInput) {
    this.id = new UuidValueObject(input.id);
  }
}
