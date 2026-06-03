import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantCreatedEvent } from '../events/plant-created/plant-created.event';
import { PlantDeletedEvent } from '../events/plant-deleted/plant-deleted.event';
import { PlantNameChangedEvent } from '../events/field-changed/plant-name-changed/plant-name-changed.event';
import { PlantSpeciesIdChangedEvent } from '../events/field-changed/plant-species-id-changed/plant-species-id-changed.event';
import { PlantUpdatedEvent } from '../events/plant-updated/plant-updated.event';
import { IPlant } from '../interfaces/plant.interface';
import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantLinkedSpeciesIdValueObject } from '../value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';
import { PlantAggregate } from './plant.aggregate';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const SPECIES_ID = '550e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2024-01-01');

const buildPlant = (overrides?: Partial<IPlant>): PlantAggregate =>
  new PlantAggregate({
    id: new PlantIdValueObject(PLANT_ID),
    name: new PlantNameValueObject('Rose'),
    plantSpeciesId: null,
    imageUrl: null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    qrId: null,
    plantingSpotId: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
    ...overrides,
  });

describe('PlantAggregate', () => {
  describe('create()', () => {
    it('should emit PlantCreatedEvent with full snapshot', () => {
      const plant = buildPlant();
      plant.create();

      const events = plant.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantCreatedEvent);
    });

    it('should include all fields in the event data', () => {
      const plant = buildPlant({
        plantSpeciesId: new PlantLinkedSpeciesIdValueObject(SPECIES_ID),
        imageUrl: new PlantImageUrlValueObject('https://example.com/rose.jpg'),
      });
      plant.create();

      const event = plant.getUncommittedEvents()[0] as PlantCreatedEvent;
      expect(event.data.id).toBe(PLANT_ID);
      expect(event.data.name).toBe('Rose');
      expect(event.data.plantSpeciesId).toBe(SPECIES_ID);
      expect(event.data.imageUrl).toBe('https://example.com/rose.jpg');
      expect(event.data.userId).toBe(USER_ID);
      expect(event.data.spaceId).toBe(SPACE_ID);
    });
  });

  describe('update()', () => {
    it('should emit PlantNameChangedEvent and PlantUpdatedEvent when name changes', () => {
      const plant = buildPlant();
      plant.update({ name: new PlantNameValueObject('Tulip') });

      const events = plant.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(PlantNameChangedEvent);
      expect(events[1]).toBeInstanceOf(PlantUpdatedEvent);
    });

    it('should emit only PlantUpdatedEvent when no fields actually change', () => {
      const plant = buildPlant();
      plant.update({ name: new PlantNameValueObject('Rose') });

      const events = plant.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantUpdatedEvent);
    });

    it('should update name when provided', () => {
      const plant = buildPlant();
      plant.update({ name: new PlantNameValueObject('Tulip') });

      expect(plant.name.value).toBe('Tulip');
    });

    it('should clear optional fields when set to null', () => {
      const plant = buildPlant({
        plantSpeciesId: new PlantLinkedSpeciesIdValueObject(SPECIES_ID),
      });
      plant.update({ plantSpeciesId: null });

      expect(plant.plantSpeciesId).toBeNull();
    });

    it('should not update fields that are undefined', () => {
      const plant = buildPlant({
        plantSpeciesId: new PlantLinkedSpeciesIdValueObject(SPECIES_ID),
      });
      plant.update({ name: new PlantNameValueObject('Updated') });

      expect(plant.plantSpeciesId?.value).toBe(SPECIES_ID);
    });

    it('should emit PlantSpeciesIdChangedEvent when plantSpeciesId changes', () => {
      const plant = buildPlant();
      plant.update({
        plantSpeciesId: new PlantLinkedSpeciesIdValueObject(SPECIES_ID),
      });

      const events = plant.getUncommittedEvents();
      expect(events[0]).toBeInstanceOf(PlantSpeciesIdChangedEvent);
    });
  });

  describe('delete()', () => {
    it('should emit PlantDeletedEvent with full snapshot', () => {
      const plant = buildPlant();
      plant.delete();

      const events = plant.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlantDeletedEvent);
    });
  });

  describe('toPrimitives()', () => {
    it('should return a round-trippable primitive snapshot', () => {
      const plant = buildPlant({
        plantSpeciesId: new PlantLinkedSpeciesIdValueObject(SPECIES_ID),
        imageUrl: new PlantImageUrlValueObject('https://example.com/rose.jpg'),
      });

      const primitives = plant.toPrimitives();

      expect(primitives.id).toBe(PLANT_ID);
      expect(primitives.name).toBe('Rose');
      expect(primitives.plantSpeciesId).toBe(SPECIES_ID);
      expect(primitives.imageUrl).toBe('https://example.com/rose.jpg');
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.spaceId).toBe(SPACE_ID);
      expect(primitives.createdAt).toEqual(NOW);
      expect(primitives.updatedAt).toEqual(NOW);
    });

    it('should return null for absent optional fields', () => {
      const plant = buildPlant();
      const primitives = plant.toPrimitives();

      expect(primitives.plantSpeciesId).toBeNull();
      expect(primitives.imageUrl).toBeNull();
    });
  });
});
