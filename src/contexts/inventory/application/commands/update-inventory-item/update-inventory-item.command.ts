import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
import { InventoryAcquiredAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-acquired-at/inventory-acquired-at.value-object';
import { InventoryExpiresAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object';
import { InventoryItemBrandValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-brand/inventory-item-brand.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemNotesValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-notes/inventory-item-notes.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';

export type UpdateInventoryItemCommandInput = Pick<
  IInventoryItemPrimitives,
  'id'
> &
  Partial<
    Omit<
      IInventoryItemPrimitives,
      'id' | 'quantity' | 'userId' | 'spaceId' | 'createdAt' | 'updatedAt'
    >
  >;

export class UpdateInventoryItemCommand {
  public readonly id: InventoryItemIdValueObject;
  public readonly itemType: InventoryItemTypeValueObject | undefined;
  public readonly name: InventoryItemNameValueObject | undefined;
  public readonly brand: InventoryItemBrandValueObject | null | undefined;
  public readonly notes: InventoryItemNotesValueObject | null | undefined;
  public readonly unit: InventoryUnitValueObject | undefined;
  public readonly lowStockThreshold:
    | InventoryLowStockThresholdValueObject
    | null
    | undefined;
  public readonly acquiredAt: InventoryAcquiredAtValueObject | null | undefined;
  public readonly expiresAt: InventoryExpiresAtValueObject | null | undefined;

  constructor(input: UpdateInventoryItemCommandInput) {
    this.id = new InventoryItemIdValueObject(input.id);
    this.itemType = input.itemType
      ? new InventoryItemTypeValueObject(
          input.itemType as InventoryItemTypeEnum,
        )
      : undefined;
    this.name = input.name
      ? new InventoryItemNameValueObject(input.name)
      : undefined;
    this.brand =
      input.brand !== undefined
        ? input.brand
          ? new InventoryItemBrandValueObject(input.brand)
          : null
        : undefined;
    this.notes =
      input.notes !== undefined
        ? input.notes
          ? new InventoryItemNotesValueObject(input.notes)
          : null
        : undefined;
    this.unit = input.unit
      ? new InventoryUnitValueObject(input.unit as InventoryUnitEnum)
      : undefined;
    this.lowStockThreshold =
      input.lowStockThreshold !== undefined
        ? input.lowStockThreshold !== null
          ? new InventoryLowStockThresholdValueObject(input.lowStockThreshold)
          : null
        : undefined;
    this.acquiredAt =
      input.acquiredAt !== undefined
        ? input.acquiredAt !== null
          ? new InventoryAcquiredAtValueObject(input.acquiredAt)
          : null
        : undefined;
    this.expiresAt =
      input.expiresAt !== undefined
        ? input.expiresAt !== null
          ? new InventoryExpiresAtValueObject(input.expiresAt)
          : null
        : undefined;
  }
}
