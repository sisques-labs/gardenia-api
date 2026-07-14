import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemNameChangedEvent } from '@contexts/inventory/domain/events/field-changed/name-changed/name-changed.event';
import { InventoryItemCreatedEvent } from '@contexts/inventory/domain/events/inventory-item-created/inventory-item-created.event';
import { InventoryItemDeletedEvent } from '@contexts/inventory/domain/events/inventory-item-deleted/inventory-item-deleted.event';
import { InventoryItemQuantityAdjustedEvent } from '@contexts/inventory/domain/events/inventory-item-quantity-adjusted/inventory-item-quantity-adjusted.event';
import { InventoryItemUpdatedEvent } from '@contexts/inventory/domain/events/inventory-item-updated/inventory-item-updated.event';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryExpiresAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { InventoryItemAggregate } from './inventory-item.aggregate';

function buildItem(quantity = 10): InventoryItemAggregate {
  return new InventoryItemAggregate({
    id: new InventoryItemIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    itemType: new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
    name: new InventoryItemNameValueObject('Lettuce seeds'),
    brand: null,
    notes: null,
    quantity: new InventoryQuantityValueObject(quantity),
    unit: new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
    lowStockThreshold: null,
    acquiredAt: null,
    expiresAt: null,
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

  describe('isLowStock()', () => {
    function buildItemWithThreshold(
      quantity: number,
      lowStockThreshold: number | null,
    ): InventoryItemAggregate {
      return new InventoryItemAggregate({
        id: new InventoryItemIdValueObject(
          '550e8400-e29b-41d4-a716-446655440000',
        ),
        itemType: new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
        name: new InventoryItemNameValueObject('Lettuce seeds'),
        brand: null,
        notes: null,
        quantity: new InventoryQuantityValueObject(quantity),
        unit: new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
        lowStockThreshold:
          lowStockThreshold !== null
            ? new InventoryLowStockThresholdValueObject(lowStockThreshold)
            : null,
        acquiredAt: null,
        expiresAt: null,
        userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
        spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
        createdAt: new DateValueObject(new Date()),
        updatedAt: new DateValueObject(new Date()),
      });
    }

    it('is low stock when quantity is at or below the threshold', () => {
      expect(buildItemWithThreshold(2, 5).isLowStock()).toBe(true);
      expect(buildItemWithThreshold(5, 5).isLowStock()).toBe(true);
    });

    it('is not low stock when quantity is above the threshold', () => {
      expect(buildItemWithThreshold(10, 5).isLowStock()).toBe(false);
    });

    it('is never low stock when no threshold is configured', () => {
      expect(buildItemWithThreshold(0, null).isLowStock()).toBe(false);
    });
  });

  describe('isExpiringWithin()', () => {
    function buildItemExpiringAt(
      expiresAt: Date | null,
    ): InventoryItemAggregate {
      return new InventoryItemAggregate({
        id: new InventoryItemIdValueObject(
          '550e8400-e29b-41d4-a716-446655440000',
        ),
        itemType: new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
        name: new InventoryItemNameValueObject('Lettuce seeds'),
        brand: null,
        notes: null,
        quantity: new InventoryQuantityValueObject(10),
        unit: new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
        lowStockThreshold: null,
        acquiredAt: null,
        expiresAt: expiresAt
          ? new InventoryExpiresAtValueObject(expiresAt)
          : null,
        userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
        spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
        createdAt: new DateValueObject(new Date()),
        updatedAt: new DateValueObject(new Date()),
      });
    }

    it('is expiring when expiresAt already passed', () => {
      const item = buildItemExpiringAt(new Date(Date.now() - 60_000));
      expect(item.isExpiringWithin(7)).toBe(true);
    });

    it('is expiring when expiresAt falls within the window', () => {
      const item = buildItemExpiringAt(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      );
      expect(item.isExpiringWithin(7)).toBe(true);
    });

    it('is not expiring when expiresAt falls outside the window', () => {
      const item = buildItemExpiringAt(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      );
      expect(item.isExpiringWithin(7)).toBe(false);
    });

    it('is never expiring when no expiresAt is set', () => {
      expect(buildItemExpiringAt(null).isExpiringWithin(7)).toBe(false);
    });
  });
});
