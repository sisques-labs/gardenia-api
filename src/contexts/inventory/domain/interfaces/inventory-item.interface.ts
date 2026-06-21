import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryAcquiredAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-acquired-at/inventory-acquired-at.value-object';
import { InventoryExpiresAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object';
import { InventoryItemBrandValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-brand/inventory-item-brand.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemNotesValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-notes/inventory-item-notes.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';

export interface IInventoryItem {
  id: InventoryItemIdValueObject;
  itemType: InventoryItemTypeValueObject;
  name: InventoryItemNameValueObject;
  brand: InventoryItemBrandValueObject | null;
  notes: InventoryItemNotesValueObject | null;
  quantity: InventoryQuantityValueObject;
  unit: InventoryUnitValueObject;
  lowStockThreshold: InventoryLowStockThresholdValueObject | null;
  acquiredAt: InventoryAcquiredAtValueObject | null;
  expiresAt: InventoryExpiresAtValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
