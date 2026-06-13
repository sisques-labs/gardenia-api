import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestCreatedEvent } from '@contexts/harvests/domain/events/harvest-created/harvest-created.event';
import { HarvestDeletedEvent } from '@contexts/harvests/domain/events/harvest-deleted/harvest-deleted.event';
import { HarvestCropTypeChangedEvent } from '@contexts/harvests/domain/events/field-changed/crop-type-changed/crop-type-changed.event';
import { HarvestQuantityChangedEvent } from '@contexts/harvests/domain/events/field-changed/quantity-changed/quantity-changed.event';
import { HarvestUpdatedEvent } from '@contexts/harvests/domain/events/harvest-updated/harvest-updated.event';
import { HarvestAggregate } from './harvest.aggregate';
import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';
import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';

function buildHarvest(): HarvestAggregate {
  return new HarvestAggregate({
    id: new HarvestIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    cropType: new HarvestCropTypeValueObject('Tomate Cherry'),
    quantity: new HarvestQuantityValueObject(2.5),
    unit: new HarvestUnitValueObject(HarvestUnitEnum.KG),
    harvestedAt: new HarvestHarvestedAtValueObject(new Date('2026-06-01')),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('HarvestAggregate', () => {
  it('create() applies HarvestCreatedEvent', () => {
    const harvest = buildHarvest();
    harvest.create();
    const events = harvest.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(HarvestCreatedEvent);
  });

  it('update() applies HarvestUpdatedEvent and field change events when value differs', () => {
    const harvest = buildHarvest();
    harvest.update({
      cropType: new HarvestCropTypeValueObject('Pepino'),
      quantity: new HarvestQuantityValueObject(5),
    });
    const events = harvest.getUncommittedEvents();
    expect(events.some((e) => e instanceof HarvestCropTypeChangedEvent)).toBe(
      true,
    );
    expect(events.some((e) => e instanceof HarvestQuantityChangedEvent)).toBe(
      true,
    );
    expect(events.some((e) => e instanceof HarvestUpdatedEvent)).toBe(true);
  });

  it('update() does NOT emit field change events when values are equal', () => {
    const harvest = buildHarvest();
    harvest.update({
      cropType: new HarvestCropTypeValueObject('Tomate Cherry'),
    });
    const events = harvest.getUncommittedEvents();
    expect(events.some((e) => e instanceof HarvestCropTypeChangedEvent)).toBe(
      false,
    );
    expect(events.some((e) => e instanceof HarvestUpdatedEvent)).toBe(true);
  });

  it('delete() applies HarvestDeletedEvent', () => {
    const harvest = buildHarvest();
    harvest.delete();
    const events = harvest.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(HarvestDeletedEvent);
  });
});
