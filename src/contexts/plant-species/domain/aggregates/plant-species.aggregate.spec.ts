import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesDescriptionChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-description-changed/plant-species-description-changed.event';
import { PlantSpeciesImageUrlChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-image-url-changed/plant-species-image-url-changed.event';
import { PlantSpeciesScientificNameChangedEvent } from '@contexts/plant-species/domain/events/field-changed/plant-species-scientific-name-changed/plant-species-scientific-name-changed.event';
import { PlantSpeciesCreatedEvent } from '@contexts/plant-species/domain/events/plant-species-created/plant-species-created.event';
import { PlantSpeciesDeletedEvent } from '@contexts/plant-species/domain/events/plant-species-deleted/plant-species-deleted.event';
import { PlantSpeciesUpdatedEvent } from '@contexts/plant-species/domain/events/plant-species-updated/plant-species-updated.event';
import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';

const PLANT_SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

const buildPlantSpecies = (): PlantSpeciesAggregate =>
  new PlantSpeciesAggregate({
    id: new PlantSpeciesIdValueObject(PLANT_SPECIES_ID),
    scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
    description: null,
    imageUrl: null,
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

  it('update() changes description and emits PlantSpeciesDescriptionChangedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({
      description: new PlantSpeciesDescriptionValueObject('A tropical plant'),
    });

    expect(plantSpecies.description?.value).toBe('A tropical plant');
    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(PlantSpeciesDescriptionChangedEvent);
    expect(events[1]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('update() changes imageUrl and emits PlantSpeciesImageUrlChangedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({
      imageUrl: new PlantSpeciesImageUrlValueObject(
        'https://example.com/img.jpg',
      ),
    });

    expect(plantSpecies.imageUrl?.value).toBe('https://example.com/img.jpg');
    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(PlantSpeciesImageUrlChangedEvent);
    expect(events[1]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('update() does not emit description changed event when value is unchanged', () => {
    const plantSpecies = new PlantSpeciesAggregate({
      id: new PlantSpeciesIdValueObject(PLANT_SPECIES_ID),
      scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
      description: new PlantSpeciesDescriptionValueObject('Same'),
      imageUrl: null,
      createdAt: new DateValueObject(NOW),
      updatedAt: new DateValueObject(NOW),
    });

    plantSpecies.update({
      description: new PlantSpeciesDescriptionValueObject('Same'),
    });

    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
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
});
