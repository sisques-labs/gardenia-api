import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';

export class InventoryItemViewModel extends BaseViewModel {
  public readonly itemType: string;
  public readonly name: string;
  public readonly brand: string | null;
  public readonly notes: string | null;
  public readonly quantity: number;
  public readonly unit: string;
  public readonly lowStockThreshold: number | null;
  public readonly acquiredAt: Date | null;
  public readonly expiresAt: Date | null;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IInventoryItemPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.itemType = props.itemType;
    this.name = props.name;
    this.brand = props.brand;
    this.notes = props.notes;
    this.quantity = props.quantity;
    this.unit = props.unit;
    this.lowStockThreshold = props.lowStockThreshold;
    this.acquiredAt = props.acquiredAt;
    this.expiresAt = props.expiresAt;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
