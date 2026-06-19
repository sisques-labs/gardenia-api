import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotCreatedEvent } from '@contexts/planting-spots/domain/events/planting-spot-created/planting-spot-created.event';
import { PlantingSpotDeletedEvent } from '@contexts/planting-spots/domain/events/planting-spot-deleted/planting-spot-deleted.event';
import { PlantingSpotUpdatedEvent } from '@contexts/planting-spots/domain/events/planting-spot-updated/planting-spot-updated.event';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

import { PlantingSpotAggregate } from './planting-spot.aggregate';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantingSpotAggregate =>
  new PlantingSpotAggregate({
    id: new PlantingSpotIdValueObject(SPOT_ID),
    name: new PlantingSpotNameValueObject('Bancal Norte'),
    type: new PlantingSpotTypeValueObject(PlantingSpotTypeEnum.RAISED_BED),
    description: null,
    capacity: null,
    row: null,
    column: null,
    dimensions: null,
    soilType: null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('PlantingSpotAggregate', () => {
  describe('create()', () => {
    it('should emit a PlantingSpotCreatedEvent', () => {
      const spot = buildAggregate();
      spot.create();
      const events = spot.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotCreatedEvent);
    });

    it('should include correct data in the created event', () => {
      const spot = buildAggregate();
      spot.create();
      const event = spot.getUncommittedEvents()[0] as PlantingSpotCreatedEvent;
      expect(event.data.id).toBe(SPOT_ID);
      expect(event.data.name).toBe('Bancal Norte');
      expect(event.data.type).toBe(PlantingSpotTypeEnum.RAISED_BED);
    });
  });

  describe('update()', () => {
    it('should emit a PlantingSpotUpdatedEvent when name changes', () => {
      const spot = buildAggregate();
      spot.update({ name: new PlantingSpotNameValueObject('Bancal Sur') });
      const events = spot.getUncommittedEvents();
      const updatedEvent = events.find(
        (e) => e instanceof PlantingSpotUpdatedEvent,
      );
      expect(updatedEvent).toBeDefined();
    });

    it('should emit a PlantingSpotUpdatedEvent when type changes', () => {
      const spot = buildAggregate();
      spot.update({
        type: new PlantingSpotTypeValueObject(PlantingSpotTypeEnum.POT),
      });
      const events = spot.getUncommittedEvents();
      const updatedEvent = events.find(
        (e) => e instanceof PlantingSpotUpdatedEvent,
      );
      expect(updatedEvent).toBeDefined();
    });

    it('should not emit field events when no field changes', () => {
      const spot = buildAggregate();
      spot.update({});
      const events = spot.getUncommittedEvents();
      // Only PlantingSpotUpdatedEvent, no field-changed events
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotUpdatedEvent);
    });
  });

  describe('delete()', () => {
    it('should emit a PlantingSpotDeletedEvent', () => {
      const spot = buildAggregate();
      spot.delete();
      const events = spot.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotDeletedEvent);
    });

    it('should include the spot id in the deleted event', () => {
      const spot = buildAggregate();
      spot.delete();
      const event = spot.getUncommittedEvents()[0] as PlantingSpotDeletedEvent;
      expect(event.data.id).toBe(SPOT_ID);
    });
  });

  describe('toPrimitives()', () => {
    it('should return primitives with correct values', () => {
      const spot = buildAggregate();
      const primitives = spot.toPrimitives();
      expect(primitives.id).toBe(SPOT_ID);
      expect(primitives.name).toBe('Bancal Norte');
      expect(primitives.type).toBe(PlantingSpotTypeEnum.RAISED_BED);
      expect(primitives.description).toBeNull();
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.spaceId).toBe(SPACE_ID);
    });
  });
});
