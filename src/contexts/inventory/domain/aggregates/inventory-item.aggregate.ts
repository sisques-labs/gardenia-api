import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemAcquiredAtChangedEvent } from '@contexts/inventory/domain/events/field-changed/acquired-at-changed/acquired-at-changed.event';
import { InventoryItemBrandChangedEvent } from '@contexts/inventory/domain/events/field-changed/brand-changed/brand-changed.event';
import { InventoryItemExpiresAtChangedEvent } from '@contexts/inventory/domain/events/field-changed/expires-at-changed/expires-at-changed.event';
import { InventoryItemLowStockThresholdChangedEvent } from '@contexts/inventory/domain/events/field-changed/low-stock-threshold-changed/low-stock-threshold-changed.event';
import { InventoryItemNameChangedEvent } from '@contexts/inventory/domain/events/field-changed/name-changed/name-changed.event';
import { InventoryItemNotesChangedEvent } from '@contexts/inventory/domain/events/field-changed/notes-changed/notes-changed.event';
import { InventoryItemTypeChangedEvent } from '@contexts/inventory/domain/events/field-changed/item-type-changed/item-type-changed.event';
import { InventoryItemUnitChangedEvent } from '@contexts/inventory/domain/events/field-changed/unit-changed/unit-changed.event';
import { InventoryItemCreatedEvent } from '@contexts/inventory/domain/events/inventory-item-created/inventory-item-created.event';
import { InventoryItemDeletedEvent } from '@contexts/inventory/domain/events/inventory-item-deleted/inventory-item-deleted.event';
import { InventoryItemQuantityAdjustedEvent } from '@contexts/inventory/domain/events/inventory-item-quantity-adjusted/inventory-item-quantity-adjusted.event';
import { InventoryItemUpdatedEvent } from '@contexts/inventory/domain/events/inventory-item-updated/inventory-item-updated.event';
import { IInventoryItem } from '@contexts/inventory/domain/interfaces/inventory-item.interface';
import { IInventoryItemPrimitives } from '@contexts/inventory/domain/primitives/inventory-item.primitives';
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

export class InventoryItemAggregate extends BaseAggregate {
  private readonly _id: InventoryItemIdValueObject;
  private _itemType: InventoryItemTypeValueObject;
  private _name: InventoryItemNameValueObject;
  private _brand: InventoryItemBrandValueObject | null;
  private _notes: InventoryItemNotesValueObject | null;
  private _quantity: InventoryQuantityValueObject;
  private _unit: InventoryUnitValueObject;
  private _lowStockThreshold: InventoryLowStockThresholdValueObject | null;
  private _acquiredAt: InventoryAcquiredAtValueObject | null;
  private _expiresAt: InventoryExpiresAtValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IInventoryItem) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._itemType = props.itemType;
    this._name = props.name;
    this._brand = props.brand;
    this._notes = props.notes;
    this._quantity = props.quantity;
    this._unit = props.unit;
    this._lowStockThreshold = props.lowStockThreshold;
    this._acquiredAt = props.acquiredAt;
    this._expiresAt = props.expiresAt;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public create(): void {
    this.apply(
      new InventoryItemCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public update(
    props: Partial<
      Omit<
        IInventoryItem,
        'id' | 'quantity' | 'userId' | 'spaceId' | 'createdAt' | 'updatedAt'
      >
    >,
  ): void {
    if (props.itemType !== undefined) this.changeItemType(props.itemType);
    if (props.name !== undefined) this.changeName(props.name);
    if (props.brand !== undefined) this.changeBrand(props.brand);
    if (props.notes !== undefined) this.changeNotes(props.notes);
    if (props.unit !== undefined) this.changeUnit(props.unit);
    if (props.lowStockThreshold !== undefined)
      this.changeLowStockThreshold(props.lowStockThreshold);
    if (props.acquiredAt !== undefined) this.changeAcquiredAt(props.acquiredAt);
    if (props.expiresAt !== undefined) this.changeExpiresAt(props.expiresAt);

    this.apply(
      new InventoryItemUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public adjustQuantity(delta: number, reason: string): void {
    const next = Math.max(0, this._quantity.value + delta);
    this._quantity = new InventoryQuantityValueObject(next);
    this.touch();
    this.apply(
      new InventoryItemQuantityAdjustedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemQuantityAdjustedEvent.name,
        },
        { id: this._id.value, delta, reason, quantity: next },
      ),
    );
  }

  /** Whether current quantity has dropped to or below the configured threshold. */
  public isLowStock(): boolean {
    if (this._lowStockThreshold === null) return false;
    return this._quantity.value <= this._lowStockThreshold.value;
  }

  /** Whether this item expires within the given window. */
  public isExpiringWithin(windowDays: number): boolean {
    if (this._expiresAt === null) return false;
    const expiringBefore = Date.now() + windowDays * 24 * 60 * 60 * 1000;
    return this._expiresAt.value.getTime() <= expiringBefore;
  }

  public delete(): void {
    this.apply(
      new InventoryItemDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  private changeItemType(newItemType: InventoryItemTypeValueObject): void {
    const oldValue = this._itemType.value;
    const newValue = newItemType.value;
    if (oldValue === newValue) return;
    this._itemType = newItemType;
    this.touch();
    this.apply(
      new InventoryItemTypeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemTypeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeName(newName: InventoryItemNameValueObject): void {
    const oldValue = this._name.value;
    const newValue = newName.value;
    if (oldValue === newValue) return;
    this._name = newName;
    this.touch();
    this.apply(
      new InventoryItemNameChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemNameChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeBrand(newBrand: InventoryItemBrandValueObject | null): void {
    const oldValue = this._brand?.value ?? null;
    const newValue = newBrand?.value ?? null;
    if (oldValue === newValue) return;
    this._brand = newBrand;
    this.touch();
    this.apply(
      new InventoryItemBrandChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemBrandChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeNotes(newNotes: InventoryItemNotesValueObject | null): void {
    const oldValue = this._notes?.value ?? null;
    const newValue = newNotes?.value ?? null;
    if (oldValue === newValue) return;
    this._notes = newNotes;
    this.touch();
    this.apply(
      new InventoryItemNotesChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemNotesChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeUnit(newUnit: InventoryUnitValueObject): void {
    const oldValue = this._unit.value;
    const newValue = newUnit.value;
    if (oldValue === newValue) return;
    this._unit = newUnit;
    this.touch();
    this.apply(
      new InventoryItemUnitChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemUnitChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeLowStockThreshold(
    newThreshold: InventoryLowStockThresholdValueObject | null,
  ): void {
    const oldValue = this._lowStockThreshold?.value ?? null;
    const newValue = newThreshold?.value ?? null;
    if (oldValue === newValue) return;
    this._lowStockThreshold = newThreshold;
    this.touch();
    this.apply(
      new InventoryItemLowStockThresholdChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemLowStockThresholdChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeAcquiredAt(
    newAcquiredAt: InventoryAcquiredAtValueObject | null,
  ): void {
    const oldValue = this._acquiredAt?.value ?? null;
    const newValue = newAcquiredAt?.value ?? null;
    if (oldValue?.getTime() === newValue?.getTime()) return;
    this._acquiredAt = newAcquiredAt;
    this.touch();
    this.apply(
      new InventoryItemAcquiredAtChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemAcquiredAtChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeExpiresAt(
    newExpiresAt: InventoryExpiresAtValueObject | null,
  ): void {
    const oldValue = this._expiresAt?.value ?? null;
    const newValue = newExpiresAt?.value ?? null;
    if (oldValue?.getTime() === newValue?.getTime()) return;
    this._expiresAt = newExpiresAt;
    this.touch();
    this.apply(
      new InventoryItemExpiresAtChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: InventoryItemAggregate.name,
          entityId: this._id.value,
          entityType: InventoryItemAggregate.name,
          eventType: InventoryItemExpiresAtChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  public toPrimitives(): IInventoryItemPrimitives {
    return {
      id: this._id.value,
      itemType: this._itemType.value,
      name: this._name.value,
      brand: this._brand?.value ?? null,
      notes: this._notes?.value ?? null,
      quantity: this._quantity.value,
      unit: this._unit.value,
      lowStockThreshold: this._lowStockThreshold?.value ?? null,
      acquiredAt: this._acquiredAt?.value ?? null,
      expiresAt: this._expiresAt?.value ?? null,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): InventoryItemIdValueObject {
    return this._id;
  }
  get itemType(): InventoryItemTypeValueObject {
    return this._itemType;
  }
  get name(): InventoryItemNameValueObject {
    return this._name;
  }
  get brand(): InventoryItemBrandValueObject | null {
    return this._brand;
  }
  get notes(): InventoryItemNotesValueObject | null {
    return this._notes;
  }
  get quantity(): InventoryQuantityValueObject {
    return this._quantity;
  }
  get unit(): InventoryUnitValueObject {
    return this._unit;
  }
  get lowStockThreshold(): InventoryLowStockThresholdValueObject | null {
    return this._lowStockThreshold;
  }
  get acquiredAt(): InventoryAcquiredAtValueObject | null {
    return this._acquiredAt;
  }
  get expiresAt(): InventoryExpiresAtValueObject | null {
    return this._expiresAt;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}
