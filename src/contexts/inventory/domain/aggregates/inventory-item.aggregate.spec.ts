import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemAcquiredAtChangedEvent } from '@contexts/inventory/domain/events/field-changed/acquired-at-changed/acquired-at-changed.event';
import { InventoryItemBrandChangedEvent } from '@contexts/inventory/domain/events/field-changed/brand-changed/brand-changed.event';
import { InventoryItemExpiresAtChangedEvent } from '@contexts/inventory/domain/events/field-changed/expires-at-changed/expires-at-changed.event';
import { InventoryItemTypeChangedEvent } from '@contexts/inventory/domain/events/field-changed/item-type-changed/item-type-changed.event';
import { InventoryItemLowStockThresholdChangedEvent } from '@contexts/inventory/domain/events/field-changed/low-stock-threshold-changed/low-stock-threshold-changed.event';
import { InventoryItemNameChangedEvent } from '@contexts/inventory/domain/events/field-changed/name-changed/name-changed.event';
import { InventoryItemNotesChangedEvent } from '@contexts/inventory/domain/events/field-changed/notes-changed/notes-changed.event';
import { InventoryItemUnitChangedEvent } from '@contexts/inventory/domain/events/field-changed/unit-changed/unit-changed.event';
import { InventoryItemCreatedEvent } from '@contexts/inventory/domain/events/inventory-item-created/inventory-item-created.event';
import { InventoryItemDeletedEvent } from '@contexts/inventory/domain/events/inventory-item-deleted/inventory-item-deleted.event';
import { InventoryItemQuantityAdjustedEvent } from '@contexts/inventory/domain/events/inventory-item-quantity-adjusted/inventory-item-quantity-adjusted.event';
import { InventoryItemUpdatedEvent } from '@contexts/inventory/domain/events/inventory-item-updated/inventory-item-updated.event';
import { IInventoryItem } from '@contexts/inventory/domain/interfaces/inventory-item.interface';
import { InventoryAcquiredAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-acquired-at/inventory-acquired-at.value-object';
import { InventoryExpiresAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object';
import { InventoryItemBrandValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-brand/inventory-item-brand.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemNotesValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-notes/inventory-item-notes.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { InventoryItemAggregate } from './inventory-item.aggregate';

function buildItem(
  quantity = 10,
  overrides: Partial<
    Pick<
      IInventoryItem,
      | 'itemType'
      | 'brand'
      | 'notes'
      | 'unit'
      | 'lowStockThreshold'
      | 'acquiredAt'
      | 'expiresAt'
    >
  > = {},
): InventoryItemAggregate {
  return new InventoryItemAggregate({
    id: new InventoryItemIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    itemType:
      overrides.itemType ??
      new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
    name: new InventoryItemNameValueObject('Lettuce seeds'),
    brand: overrides.brand ?? null,
    notes: overrides.notes ?? null,
    quantity: new InventoryQuantityValueObject(quantity),
    unit:
      overrides.unit ?? new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
    lowStockThreshold: overrides.lowStockThreshold ?? null,
    acquiredAt: overrides.acquiredAt ?? null,
    expiresAt: overrides.expiresAt ?? null,
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('InventoryItemAggregate', () => {
  it('create() applies InventoryItemCreatedEvent', () => {
    const item = buildItem();
    item.create();
    const events = item.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InventoryItemCreatedEvent);
  });

  it('update() applies field change events when a value differs', () => {
    const item = buildItem();
    item.update({ name: new InventoryItemNameValueObject('Tomato seeds') });
    const events = item.getUncommittedEvents();
    expect(events.some((e) => e instanceof InventoryItemNameChangedEvent)).toBe(
      true,
    );
    expect(events.some((e) => e instanceof InventoryItemUpdatedEvent)).toBe(
      true,
    );
  });

  it('update() does NOT emit a field change event when the value is equal', () => {
    const item = buildItem();
    item.update({ name: new InventoryItemNameValueObject('Lettuce seeds') });
    const events = item.getUncommittedEvents();
    expect(events.some((e) => e instanceof InventoryItemNameChangedEvent)).toBe(
      false,
    );
    expect(events.some((e) => e instanceof InventoryItemUpdatedEvent)).toBe(
      true,
    );
  });

  it('adjustQuantity() consumes stock and emits the adjusted event', () => {
    const item = buildItem(10);
    item.adjustQuantity(-3, 'sowed lettuce');
    expect(item.quantity.value).toBe(7);
    const events = item.getUncommittedEvents();
    expect(
      events.some((e) => e instanceof InventoryItemQuantityAdjustedEvent),
    ).toBe(true);
  });

  it('adjustQuantity() clamps the result at zero on over-consumption', () => {
    const item = buildItem(2);
    item.adjustQuantity(-5, 'used everything');
    expect(item.quantity.value).toBe(0);
  });

  it('adjustQuantity() restocks stock', () => {
    const item = buildItem(2);
    item.adjustQuantity(5, 'bought more');
    expect(item.quantity.value).toBe(7);
  });

  it('delete() applies InventoryItemDeletedEvent', () => {
    const item = buildItem();
    item.delete();
    const events = item.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InventoryItemDeletedEvent);
  });

  it('update() does NOT emit ItemTypeChangedEvent when itemType is equal', () => {
    const item = buildItem();
    item.update({
      itemType: new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
    });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemTypeChangedEvent),
    ).toBe(false);
  });

  it('update() emits ItemTypeChangedEvent when itemType changes', () => {
    const item = buildItem();
    item.update({
      itemType: new InventoryItemTypeValueObject(
        InventoryItemTypeEnum.FERTILIZER,
      ),
    });
    expect(item.itemType.value).toBe(InventoryItemTypeEnum.FERTILIZER);
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemTypeChangedEvent),
    ).toBe(true);
  });

  it('update() emits BrandChangedEvent when brand goes from null to a value', () => {
    const item = buildItem();
    item.update({ brand: new InventoryItemBrandValueObject('Miracle-Gro') });
    expect(item.brand?.value).toBe('Miracle-Gro');
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemBrandChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit BrandChangedEvent when brand is equal', () => {
    const item = buildItem(10, {
      brand: new InventoryItemBrandValueObject('Miracle-Gro'),
    });
    item.update({ brand: new InventoryItemBrandValueObject('Miracle-Gro') });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemBrandChangedEvent),
    ).toBe(false);
  });

  it('update() emits BrandChangedEvent when brand is cleared to null', () => {
    const item = buildItem(10, {
      brand: new InventoryItemBrandValueObject('Miracle-Gro'),
    });
    item.update({ brand: null });
    expect(item.brand).toBeNull();
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemBrandChangedEvent),
    ).toBe(true);
  });

  it('update() emits NotesChangedEvent when notes go from null to a value', () => {
    const item = buildItem();
    item.update({
      notes: new InventoryItemNotesValueObject('Kept indoors'),
    });
    expect(item.notes?.value).toBe('Kept indoors');
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemNotesChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit NotesChangedEvent when notes are equal', () => {
    const item = buildItem(10, {
      notes: new InventoryItemNotesValueObject('Kept indoors'),
    });
    item.update({ notes: new InventoryItemNotesValueObject('Kept indoors') });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemNotesChangedEvent),
    ).toBe(false);
  });

  it('update() emits NotesChangedEvent when notes are cleared to null', () => {
    const item = buildItem(10, {
      notes: new InventoryItemNotesValueObject('Kept indoors'),
    });
    item.update({ notes: null });
    expect(item.notes).toBeNull();
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemNotesChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit UnitChangedEvent when unit is equal', () => {
    const item = buildItem();
    item.update({
      unit: new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
    });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemUnitChangedEvent),
    ).toBe(false);
  });

  it('update() emits UnitChangedEvent when unit changes', () => {
    const item = buildItem();
    item.update({ unit: new InventoryUnitValueObject(InventoryUnitEnum.KG) });
    expect(item.unit.value).toBe(InventoryUnitEnum.KG);
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemUnitChangedEvent),
    ).toBe(true);
  });

  it('update() emits LowStockThresholdChangedEvent when threshold goes from null to a value', () => {
    const item = buildItem();
    item.update({
      lowStockThreshold: new InventoryLowStockThresholdValueObject(5),
    });
    expect(item.lowStockThreshold?.value).toBe(5);
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemLowStockThresholdChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit LowStockThresholdChangedEvent when threshold is equal', () => {
    const item = buildItem(10, {
      lowStockThreshold: new InventoryLowStockThresholdValueObject(5),
    });
    item.update({
      lowStockThreshold: new InventoryLowStockThresholdValueObject(5),
    });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemLowStockThresholdChangedEvent),
    ).toBe(false);
  });

  it('update() emits LowStockThresholdChangedEvent when threshold is cleared to null', () => {
    const item = buildItem(10, {
      lowStockThreshold: new InventoryLowStockThresholdValueObject(5),
    });
    item.update({ lowStockThreshold: null });
    expect(item.lowStockThreshold).toBeNull();
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemLowStockThresholdChangedEvent),
    ).toBe(true);
  });

  it('update() emits AcquiredAtChangedEvent when acquiredAt goes from null to a value', () => {
    const item = buildItem();
    const acquiredAt = new Date('2026-01-10T00:00:00.000Z');
    item.update({ acquiredAt: new InventoryAcquiredAtValueObject(acquiredAt) });
    expect(item.acquiredAt?.value).toEqual(acquiredAt);
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemAcquiredAtChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit AcquiredAtChangedEvent when acquiredAt is equal', () => {
    const acquiredAt = new Date('2026-01-10T00:00:00.000Z');
    const item = buildItem(10, {
      acquiredAt: new InventoryAcquiredAtValueObject(acquiredAt),
    });
    item.update({
      acquiredAt: new InventoryAcquiredAtValueObject(
        new Date(acquiredAt.getTime()),
      ),
    });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemAcquiredAtChangedEvent),
    ).toBe(false);
  });

  it('update() emits AcquiredAtChangedEvent when acquiredAt is cleared to null', () => {
    const acquiredAt = new Date('2026-01-10T00:00:00.000Z');
    const item = buildItem(10, {
      acquiredAt: new InventoryAcquiredAtValueObject(acquiredAt),
    });
    item.update({ acquiredAt: null });
    expect(item.acquiredAt).toBeNull();
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemAcquiredAtChangedEvent),
    ).toBe(true);
  });

  it('update() emits ExpiresAtChangedEvent when expiresAt goes from null to a value', () => {
    const item = buildItem();
    const expiresAt = new Date('2026-12-31T00:00:00.000Z');
    item.update({ expiresAt: new InventoryExpiresAtValueObject(expiresAt) });
    expect(item.expiresAt?.value).toEqual(expiresAt);
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemExpiresAtChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit ExpiresAtChangedEvent when expiresAt is equal', () => {
    const expiresAt = new Date('2026-12-31T00:00:00.000Z');
    const item = buildItem(10, {
      expiresAt: new InventoryExpiresAtValueObject(expiresAt),
    });
    item.update({
      expiresAt: new InventoryExpiresAtValueObject(
        new Date(expiresAt.getTime()),
      ),
    });
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemExpiresAtChangedEvent),
    ).toBe(false);
  });

  it('update() emits ExpiresAtChangedEvent when expiresAt is cleared to null', () => {
    const expiresAt = new Date('2026-12-31T00:00:00.000Z');
    const item = buildItem(10, {
      expiresAt: new InventoryExpiresAtValueObject(expiresAt),
    });
    item.update({ expiresAt: null });
    expect(item.expiresAt).toBeNull();
    expect(
      item
        .getUncommittedEvents()
        .some((e) => e instanceof InventoryItemExpiresAtChangedEvent),
    ).toBe(true);
  });

  it('exposes id, name, userId and spaceId getters', () => {
    const item = buildItem();
    expect(item.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(item.name.value).toBe('Lettuce seeds');
    expect(item.userId.value).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(item.spaceId.value).toBe('770e8400-e29b-41d4-a716-446655440002');
  });
});
