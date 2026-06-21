import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
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

@Injectable()
export class InventoryItemBuilder extends BaseBuilder<
  InventoryItemAggregate,
  InventoryItemViewModel
> {
  private _itemType!: string;
  private _name!: string;
  private _brand: string | null = null;
  private _notes: string | null = null;
  private _quantity!: number;
  private _unit!: string;
  private _lowStockThreshold: number | null = null;
  private _acquiredAt: Date | null = null;
  private _expiresAt: Date | null = null;
  private _userId!: string;
  private _spaceId!: string;

  withItemType(itemType: string): this {
    this._itemType = itemType;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withBrand(brand: string | null): this {
    this._brand = brand;
    return this;
  }

  withNotes(notes: string | null): this {
    this._notes = notes;
    return this;
  }

  withQuantity(quantity: number): this {
    this._quantity = quantity;
    return this;
  }

  withUnit(unit: string): this {
    this._unit = unit;
    return this;
  }

  withLowStockThreshold(lowStockThreshold: number | null): this {
    this._lowStockThreshold = lowStockThreshold;
    return this;
  }

  withAcquiredAt(acquiredAt: Date | null): this {
    this._acquiredAt = acquiredAt;
    return this;
  }

  withExpiresAt(expiresAt: Date | null): this {
    this._expiresAt = expiresAt;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  public override build(): InventoryItemAggregate {
    this.validate();
    return new InventoryItemAggregate({
      id: new InventoryItemIdValueObject(this._id),
      itemType: new InventoryItemTypeValueObject(
        this._itemType as InventoryItemTypeEnum,
      ),
      name: new InventoryItemNameValueObject(this._name),
      brand:
        this._brand != null
          ? new InventoryItemBrandValueObject(this._brand)
          : null,
      notes:
        this._notes != null
          ? new InventoryItemNotesValueObject(this._notes)
          : null,
      quantity: new InventoryQuantityValueObject(this._quantity),
      unit: new InventoryUnitValueObject(this._unit as InventoryUnitEnum),
      lowStockThreshold:
        this._lowStockThreshold != null
          ? new InventoryLowStockThresholdValueObject(this._lowStockThreshold)
          : null,
      acquiredAt:
        this._acquiredAt != null
          ? new InventoryAcquiredAtValueObject(this._acquiredAt)
          : null,
      expiresAt:
        this._expiresAt != null
          ? new InventoryExpiresAtValueObject(this._expiresAt)
          : null,
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): InventoryItemViewModel {
    this.validate();
    return new InventoryItemViewModel({
      id: this._id,
      itemType: this._itemType,
      name: this._name,
      brand: this._brand,
      notes: this._notes,
      quantity: this._quantity,
      unit: this._unit,
      lowStockThreshold: this._lowStockThreshold,
      acquiredAt: this._acquiredAt,
      expiresAt: this._expiresAt,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._itemType) throw new FieldIsRequiredException('itemType');
    if (!this._name) throw new FieldIsRequiredException('name');
    if (this._quantity === undefined)
      throw new FieldIsRequiredException('quantity');
    if (!this._unit) throw new FieldIsRequiredException('unit');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}
