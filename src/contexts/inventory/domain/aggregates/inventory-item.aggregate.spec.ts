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
});
