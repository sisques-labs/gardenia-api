import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
import { InventoryAdjustmentReasonValueObject } from '@contexts/inventory/domain/value-objects/inventory-adjustment-reason/inventory-adjustment-reason.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryQuantityDeltaValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity-delta/inventory-quantity-delta.value-object';

export type AdjustInventoryItemQuantityCommandInput = Pick<
  IInventoryItemPrimitives,
  'id'
> & {
  delta: number;
  reason: string;
};

export class AdjustInventoryItemQuantityCommand {
  public readonly id: InventoryItemIdValueObject;
  public readonly delta: InventoryQuantityDeltaValueObject;
  public readonly reason: InventoryAdjustmentReasonValueObject;

  constructor(input: AdjustInventoryItemQuantityCommandInput) {
    this.id = new InventoryItemIdValueObject(input.id);
    this.delta = new InventoryQuantityDeltaValueObject(input.delta);
    this.reason = new InventoryAdjustmentReasonValueObject(input.reason);
  }
}
