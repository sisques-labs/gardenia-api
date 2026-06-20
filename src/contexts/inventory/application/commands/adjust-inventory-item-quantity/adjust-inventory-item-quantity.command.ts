import { InventoryAdjustmentReasonValueObject } from '@contexts/inventory/domain/value-objects/inventory-adjustment-reason/inventory-adjustment-reason.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';

export type AdjustInventoryItemQuantityCommandInput = {
  id: string;
  delta: number;
  reason: string;
};

export class AdjustInventoryItemQuantityCommand {
  public readonly id: InventoryItemIdValueObject;
  public readonly delta: number;
  public readonly reason: InventoryAdjustmentReasonValueObject;

  constructor(input: AdjustInventoryItemQuantityCommandInput) {
    this.id = new InventoryItemIdValueObject(input.id);
    this.delta = input.delta;
    this.reason = new InventoryAdjustmentReasonValueObject(input.reason);
  }
}
