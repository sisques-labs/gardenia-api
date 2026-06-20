import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryAcquiredAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-acquired-at/inventory-acquired-at.value-object';
import { InventoryExpiresAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object';
import { InventoryItemBrandValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-brand/inventory-item-brand.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemNotesValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-notes/inventory-item-notes.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';

export type CreateInventoryItemCommandInput = {
  itemType: string;
  name: string;
  brand?: string | null;
  notes?: string | null;
  quantity: number;
  unit: string;
  lowStockThreshold?: number | null;
  acquiredAt?: Date | null;
  expiresAt?: Date | null;
  userId: string;
  spaceId: string;
};

export class CreateInventoryItemCommand {
  public readonly itemType: InventoryItemTypeValueObject;
  public readonly name: InventoryItemNameValueObject;
  public readonly brand: InventoryItemBrandValueObject | null;
  public readonly notes: InventoryItemNotesValueObject | null;
  public readonly quantity: InventoryQuantityValueObject;
  public readonly unit: InventoryUnitValueObject;
  public readonly lowStockThreshold: InventoryLowStockThresholdValueObject | null;
  public readonly acquiredAt: InventoryAcquiredAtValueObject | null;
  public readonly expiresAt: InventoryExpiresAtValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: CreateInventoryItemCommandInput) {
    this.itemType = new InventoryItemTypeValueObject(
      input.itemType as InventoryItemTypeEnum,
    );
    this.name = new InventoryItemNameValueObject(input.name);
    this.brand = input.brand
      ? new InventoryItemBrandValueObject(input.brand)
      : null;
    this.notes = input.notes
      ? new InventoryItemNotesValueObject(input.notes)
      : null;
    this.quantity = new InventoryQuantityValueObject(input.quantity);
    this.unit = new InventoryUnitValueObject(input.unit as InventoryUnitEnum);
    this.lowStockThreshold =
      input.lowStockThreshold !== undefined && input.lowStockThreshold !== null
        ? new InventoryLowStockThresholdValueObject(input.lowStockThreshold)
        : null;
    this.acquiredAt = input.acquiredAt
      ? new InventoryAcquiredAtValueObject(input.acquiredAt)
      : null;
    this.expiresAt = input.expiresAt
      ? new InventoryExpiresAtValueObject(input.expiresAt)
      : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
