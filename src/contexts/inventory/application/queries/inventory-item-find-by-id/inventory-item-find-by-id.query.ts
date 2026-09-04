import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type InventoryItemFindByIdQueryInput = Pick<
  IInventoryItemPrimitives,
  'id'
>;

export class InventoryItemFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: InventoryItemFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
