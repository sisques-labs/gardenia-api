import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantCreatedEvent } from '../events/plant-created/plant-created.event';
import { PlantDeletedEvent } from '../events/plant-deleted/plant-deleted.event';
import { PlantUpdatedEvent } from '../events/plant-updated/plant-updated.event';
import { IPlant } from '../interfaces/plant.interface';
import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesValueObject } from '../value-objects/plant-species/plant-species.value-object';
import { PlantAggregate } from './plant.aggregate';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildPlant = (overrides?: Partial<IPlant>): PlantAggregate =>
  new PlantAggregate({
    id: new PlantIdValueObject(PLANT_ID),
    name: new PlantNameValueObject('Rose'),
    species: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
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
        species: new PlantSpeciesValueObject('Rosa canina'),
        imageUrl: new PlantImageUrlValueObject('https://example.com/rose.jpg'),
      });
      plant.create();

      const event = plant.getUncommittedEvents()[0] as PlantCreatedEvent;
      expect(event.data.id).toBe(PLANT_ID);
      expect(event.data.name).toBe('Rose');
      expect(event.data.species).toBe('Rosa canina');
      expect(event.data.imageUrl).toBe('https://example.com/rose.jpg');
      expect(event.data.userId).toBe(USER_ID);
      expect(event.data.spaceId).toBe(SPACE_ID);
    });
  });

  describe('update()', () => {
    it('should emit a single PlantUpdatedEvent', () => {
      const plant = buildPlant();
      plant.update({ name: new PlantNameValueObject('Tulip') });

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
        species: new PlantSpeciesValueObject('Rosa canina'),
      });
      plant.update({ species: null });

      expect(plant.species).toBeNull();
    });

    it('should not update fields that are undefined', () => {
      const plant = buildPlant({
        species: new PlantSpeciesValueObject('Rosa canina'),
      });
      plant.update({ name: new PlantNameValueObject('Updated') });

      expect(plant.species?.value).toBe('Rosa canina');
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
        species: new PlantSpeciesValueObject('Rosa canina'),
        imageUrl: new PlantImageUrlValueObject('https://example.com/rose.jpg'),
      });

      const primitives = plant.toPrimitives();

      expect(primitives.id).toBe(PLANT_ID);
      expect(primitives.name).toBe('Rose');
      expect(primitives.species).toBe('Rosa canina');
      expect(primitives.imageUrl).toBe('https://example.com/rose.jpg');
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.spaceId).toBe(SPACE_ID);
      expect(primitives.createdAt).toEqual(NOW);
      expect(primitives.updatedAt).toEqual(NOW);
    });

    it('should return null for absent optional fields', () => {
      const plant = buildPlant();
      const primitives = plant.toPrimitives();

      expect(primitives.species).toBeNull();
      expect(primitives.imageUrl).toBeNull();
    });
  });
});
