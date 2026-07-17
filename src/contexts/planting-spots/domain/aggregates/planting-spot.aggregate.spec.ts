import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotCreatedEvent } from '@contexts/planting-spots/domain/events/planting-spot-created/planting-spot-created.event';
import { PlantingSpotDeletedEvent } from '@contexts/planting-spots/domain/events/planting-spot-deleted/planting-spot-deleted.event';
import { PlantingSpotUpdatedEvent } from '@contexts/planting-spots/domain/events/planting-spot-updated/planting-spot-updated.event';
import { PlantingSpotCapacityChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/capacity-changed/capacity-changed.event';
import { PlantingSpotColumnChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/column-changed/column-changed.event';
import { PlantingSpotDescriptionChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/description-changed/description-changed.event';
import { PlantingSpotDimensionsChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/dimensions-changed/dimensions-changed.event';
import { PlantingSpotRowChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/row-changed/row-changed.event';
import { PlantingSpotSoilTypeChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/soil-type-changed/soil-type-changed.event';
import { PlantingSpotStatusChangedEvent } from '@contexts/planting-spots/domain/events/field-changed/status-changed/status-changed.event';
import { PlantingSpotCapacityValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotFallowSinceValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-fallow-since/planting-spot-fallow-since.value-object';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
import { PlantingSpotStatusValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-status/planting-spot-status.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

import { PlantingSpotAggregate } from './planting-spot.aggregate';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const QR_ID = '550e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2024-01-01');

const buildAggregate = (
  status: PlantingSpotStatusEnum = PlantingSpotStatusEnum.ACTIVE,
  fallowSince: Date | null = null,
): PlantingSpotAggregate =>
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
    status: new PlantingSpotStatusValueObject(status),
    fallowSince: fallowSince
      ? new PlantingSpotFallowSinceValueObject(fallowSince)
      : null,
    qrId: null,
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

    it('should not emit a field-changed event when name stays the same', () => {
      const spot = buildAggregate();
      spot.update({ name: new PlantingSpotNameValueObject('Bancal Norte') });
      const events = spot.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotUpdatedEvent);
    });

    it('should not emit a field-changed event when type stays the same', () => {
      const spot = buildAggregate();
      spot.update({
        type: new PlantingSpotTypeValueObject(PlantingSpotTypeEnum.RAISED_BED),
      });
      const events = spot.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotUpdatedEvent);
    });

    it('should not emit field events when no field changes', () => {
      const spot = buildAggregate();
      spot.update({});
      const events = spot.getUncommittedEvents();
      // Only PlantingSpotUpdatedEvent, no field-changed events
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotUpdatedEvent);
    });

    it('should emit a PlantingSpotDescriptionChangedEvent when description changes from null', () => {
      const spot = buildAggregate();
      spot.update({
        description: new PlantingSpotDescriptionValueObject(
          'Suelo rico en materia orgánica',
        ),
      });
      const events = spot.getUncommittedEvents();
      const changedEvent = events.find(
        (e) => e instanceof PlantingSpotDescriptionChangedEvent,
      ) as PlantingSpotDescriptionChangedEvent;
      expect(changedEvent).toBeDefined();
      expect(changedEvent.data.oldValue).toBeNull();
      expect(changedEvent.data.newValue).toBe('Suelo rico en materia orgánica');
      expect(spot.description?.value).toBe('Suelo rico en materia orgánica');
    });

    it('should not emit a PlantingSpotDescriptionChangedEvent when description stays null', () => {
      const spot = buildAggregate();
      spot.update({ description: null });
      const events = spot.getUncommittedEvents();
      expect(
        events.find((e) => e instanceof PlantingSpotDescriptionChangedEvent),
      ).toBeUndefined();
      expect(spot.description).toBeNull();
    });

    it('should emit a PlantingSpotCapacityChangedEvent when capacity changes from null', () => {
      const spot = buildAggregate();
      spot.update({ capacity: new PlantingSpotCapacityValueObject(12) });
      const events = spot.getUncommittedEvents();
      const changedEvent = events.find(
        (e) => e instanceof PlantingSpotCapacityChangedEvent,
      ) as PlantingSpotCapacityChangedEvent;
      expect(changedEvent).toBeDefined();
      expect(changedEvent.data.oldValue).toBeNull();
      expect(changedEvent.data.newValue).toBe(12);
      expect(spot.capacity?.value).toBe(12);
    });

    it('should not emit a PlantingSpotCapacityChangedEvent when capacity stays null', () => {
      const spot = buildAggregate();
      spot.update({ capacity: null });
      const events = spot.getUncommittedEvents();
      expect(
        events.find((e) => e instanceof PlantingSpotCapacityChangedEvent),
      ).toBeUndefined();
      expect(spot.capacity).toBeNull();
    });

    it('should emit a PlantingSpotRowChangedEvent when row changes from null', () => {
      const spot = buildAggregate();
      spot.update({ row: new PlantingSpotRowValueObject(3) });
      const events = spot.getUncommittedEvents();
      const changedEvent = events.find(
        (e) => e instanceof PlantingSpotRowChangedEvent,
      ) as PlantingSpotRowChangedEvent;
      expect(changedEvent).toBeDefined();
      expect(changedEvent.data.oldValue).toBeNull();
      expect(changedEvent.data.newValue).toBe(3);
      expect(spot.row?.value).toBe(3);
    });

    it('should not emit a PlantingSpotRowChangedEvent when row stays null', () => {
      const spot = buildAggregate();
      spot.update({ row: null });
      const events = spot.getUncommittedEvents();
      expect(
        events.find((e) => e instanceof PlantingSpotRowChangedEvent),
      ).toBeUndefined();
      expect(spot.row).toBeNull();
    });

    it('should emit a PlantingSpotColumnChangedEvent when column changes from null', () => {
      const spot = buildAggregate();
      spot.update({ column: new PlantingSpotColumnValueObject(5) });
      const events = spot.getUncommittedEvents();
      const changedEvent = events.find(
        (e) => e instanceof PlantingSpotColumnChangedEvent,
      ) as PlantingSpotColumnChangedEvent;
      expect(changedEvent).toBeDefined();
      expect(changedEvent.data.oldValue).toBeNull();
      expect(changedEvent.data.newValue).toBe(5);
      expect(spot.column?.value).toBe(5);
    });

    it('should not emit a PlantingSpotColumnChangedEvent when column stays null', () => {
      const spot = buildAggregate();
      spot.update({ column: null });
      const events = spot.getUncommittedEvents();
      expect(
        events.find((e) => e instanceof PlantingSpotColumnChangedEvent),
      ).toBeUndefined();
      expect(spot.column).toBeNull();
    });

    it('should emit a PlantingSpotSoilTypeChangedEvent when soilType changes from null', () => {
      const spot = buildAggregate();
      spot.update({
        soilType: new PlantingSpotSoilTypeValueObject('arcilloso'),
      });
      const events = spot.getUncommittedEvents();
      const changedEvent = events.find(
        (e) => e instanceof PlantingSpotSoilTypeChangedEvent,
      ) as PlantingSpotSoilTypeChangedEvent;
      expect(changedEvent).toBeDefined();
      expect(changedEvent.data.oldValue).toBeNull();
      expect(changedEvent.data.newValue).toBe('arcilloso');
      expect(spot.soilType?.value).toBe('arcilloso');
    });

    it('should not emit a PlantingSpotSoilTypeChangedEvent when soilType stays null', () => {
      const spot = buildAggregate();
      spot.update({ soilType: null });
      const events = spot.getUncommittedEvents();
      expect(
        events.find((e) => e instanceof PlantingSpotSoilTypeChangedEvent),
      ).toBeUndefined();
      expect(spot.soilType).toBeNull();
    });
  });

  describe('update() dimensions', () => {
    it('should not emit a PlantingSpotDimensionsChangedEvent when dimensions stay null', () => {
      const spot = buildAggregate();
      spot.update({ dimensions: null });
      const events = spot.getUncommittedEvents();
      expect(
        events.find((e) => e instanceof PlantingSpotDimensionsChangedEvent),
      ).toBeUndefined();
      expect(spot.dimensions).toBeNull();
    });

    it('should emit a PlantingSpotDimensionsChangedEvent when width changes from null', () => {
      const spot = buildAggregate();
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 200,
        }),
      });
      const events = spot.getUncommittedEvents();
      const changedEvent = events.find(
        (e) => e instanceof PlantingSpotDimensionsChangedEvent,
      ) as PlantingSpotDimensionsChangedEvent;
      expect(changedEvent).toBeDefined();
      expect(changedEvent.data.oldValue).toBeNull();
      expect(changedEvent.data.newValue).toEqual({
        width: 100,
        height: 50,
        length: 200,
      });
      expect(spot.dimensions).toEqual({ width: 100, height: 50, length: 200 });
    });

    it('should emit a PlantingSpotDimensionsChangedEvent when only height changes', () => {
      const spot = buildAggregate();
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 200,
        }),
      });
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 80,
          length: 200,
        }),
      });
      const changedEvents = spot
        .getUncommittedEvents()
        .filter((e) => e instanceof PlantingSpotDimensionsChangedEvent);
      expect(changedEvents).toHaveLength(2);
      expect(spot.dimensions).toEqual({ width: 100, height: 80, length: 200 });
    });

    it('should emit a PlantingSpotDimensionsChangedEvent when only length changes', () => {
      const spot = buildAggregate();
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 200,
        }),
      });
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 300,
        }),
      });
      const changedEvents = spot
        .getUncommittedEvents()
        .filter((e) => e instanceof PlantingSpotDimensionsChangedEvent);
      expect(changedEvents).toHaveLength(2);
      expect(spot.dimensions).toEqual({ width: 100, height: 50, length: 300 });
    });

    it('should not emit a PlantingSpotDimensionsChangedEvent when dimensions stay the same', () => {
      const spot = buildAggregate();
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 200,
        }),
      });
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 200,
        }),
      });
      const changedEvents = spot
        .getUncommittedEvents()
        .filter((e) => e instanceof PlantingSpotDimensionsChangedEvent);
      expect(changedEvents).toHaveLength(1);
    });

    it('should emit a PlantingSpotDimensionsChangedEvent when dimensions are cleared to null', () => {
      const spot = buildAggregate();
      spot.update({
        dimensions: new PlantingSpotDimensionsValueObject({
          width: 100,
          height: 50,
          length: 200,
        }),
      });
      spot.update({ dimensions: null });
      const changedEvents = spot
        .getUncommittedEvents()
        .filter((e) => e instanceof PlantingSpotDimensionsChangedEvent);
      expect(changedEvents).toHaveLength(2);
      expect(spot.dimensions).toBeNull();
    });
  });

  describe('markFallow()', () => {
    it('should set status to FALLOW and fallowSince to now', () => {
      const spot = buildAggregate();
      spot.markFallow();
      expect(spot.status.value).toBe(PlantingSpotStatusEnum.FALLOW);
      expect(spot.fallowSince).not.toBeNull();
    });

    it('should emit a PlantingSpotStatusChangedEvent', () => {
      const spot = buildAggregate();
      spot.markFallow();
      const events = spot.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotStatusChangedEvent);
    });

    it('should be a no-op when already fallow', () => {
      const spot = buildAggregate(
        PlantingSpotStatusEnum.FALLOW,
        new Date('2025-06-01'),
      );
      spot.markFallow();
      expect(spot.getUncommittedEvents()).toHaveLength(0);
      expect(spot.fallowSince?.value).toEqual(new Date('2025-06-01'));
    });
  });

  describe('markActive()', () => {
    it('should set status to ACTIVE and clear fallowSince', () => {
      const spot = buildAggregate(
        PlantingSpotStatusEnum.FALLOW,
        new Date('2025-06-01'),
      );
      spot.markActive();
      expect(spot.status.value).toBe(PlantingSpotStatusEnum.ACTIVE);
      expect(spot.fallowSince).toBeNull();
    });

    it('should emit a PlantingSpotStatusChangedEvent', () => {
      const spot = buildAggregate(
        PlantingSpotStatusEnum.FALLOW,
        new Date('2025-06-01'),
      );
      spot.markActive();
      const events = spot.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantingSpotStatusChangedEvent);
    });

    it('should be a no-op when already active', () => {
      const spot = buildAggregate();
      spot.markActive();
      expect(spot.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('update() does not touch status', () => {
    it('should leave status and fallowSince unchanged', () => {
      const spot = buildAggregate(
        PlantingSpotStatusEnum.FALLOW,
        new Date('2025-06-01'),
      );
      spot.update({ name: new PlantingSpotNameValueObject('Bancal Sur') });
      expect(spot.status.value).toBe(PlantingSpotStatusEnum.FALLOW);
      expect(spot.fallowSince?.value).toEqual(new Date('2025-06-01'));
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

  describe('linkQr()', () => {
    it('should set the qrId', () => {
      const spot = buildAggregate();
      spot.linkQr(new UuidValueObject(QR_ID));
      expect(spot.qrId?.value).toBe(QR_ID);
    });
  });

  describe('getters', () => {
    it('should expose id, name and type', () => {
      const spot = buildAggregate();
      expect(spot.id.value).toBe(SPOT_ID);
      expect(spot.name.value).toBe('Bancal Norte');
      expect(spot.type.value).toBe(PlantingSpotTypeEnum.RAISED_BED);
    });

    it('should expose userId and spaceId', () => {
      const spot = buildAggregate();
      expect(spot.userId.value).toBe(USER_ID);
      expect(spot.spaceId.value).toBe(SPACE_ID);
    });
  });
});
