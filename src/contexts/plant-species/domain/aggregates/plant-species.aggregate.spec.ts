import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesGbifKeyChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-gbif-key-changed/plant-species-gbif-key-changed.event';
import { PlantSpeciesScientificNameChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-scientific-name-changed/plant-species-scientific-name-changed.event';
import { PlantSpeciesCreatedEvent } from '@contexts/plant-species/domain/events/plant-species-created/plant-species-created.event';
import { PlantSpeciesDeletedEvent } from '@contexts/plant-species/domain/events/plant-species-deleted/plant-species-deleted.event';
import { PlantSpeciesUpdatedEvent } from '@contexts/plant-species/domain/events/plant-species-updated/plant-species-updated.event';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';

const PLANT_SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

const buildPlantSpecies = (): PlantSpeciesAggregate =>
  new PlantSpeciesAggregate({
    id: new PlantSpeciesIdValueObject(PLANT_SPECIES_ID),
    scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
    gbifKey: new PlantSpeciesGbifKeyValueObject(2882337),
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('PlantSpeciesAggregate', () => {
  it('create() emits PlantSpeciesCreatedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.create();

    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantSpeciesCreatedEvent);
  });

  it('update() changes scientificName and emits PlantSpeciesScientificNameChangedEvent + PlantSpeciesUpdatedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({
      scientificName: new PlantSpeciesScientificNameValueObject('Basil'),
    });

    expect(plantSpecies.scientificName.value).toBe('Basil');
    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(PlantSpeciesScientificNameChangedEvent);
    expect(events[1]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('update() emits only PlantSpeciesUpdatedEvent when scientificName does not change', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({
      scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
    });

    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('update() changes gbifKey and emits PlantSpeciesGbifKeyChangedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({
      gbifKey: new PlantSpeciesGbifKeyValueObject(5352251),
    });

    expect(plantSpecies.gbifKey?.value).toBe(5352251);
    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(PlantSpeciesGbifKeyChangedEvent);
    expect(events[1]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('update() does not emit gbifKey changed event when value is unchanged', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({
      gbifKey: new PlantSpeciesGbifKeyValueObject(2882337),
    });

    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('update() can clear gbifKey to null', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({ gbifKey: null });

    expect(plantSpecies.gbifKey).toBeNull();
    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(PlantSpeciesGbifKeyChangedEvent);
  });

  it('delete() emits PlantSpeciesDeletedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.delete();

    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantSpeciesDeletedEvent);
  });

  it('rejects empty scientificName', () => {
    expect(() => new PlantSpeciesScientificNameValueObject('   ')).toThrow();
  });

  it('rejects a non-positive gbifKey', () => {
    expect(() => new PlantSpeciesGbifKeyValueObject(0)).toThrow();
  });
});
