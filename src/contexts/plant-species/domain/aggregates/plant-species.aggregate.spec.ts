import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesCreatedEvent } from '@contexts/plant-species/domain/events/plant-species-created/plant-species-created.event';
import { PlantSpeciesDeletedEvent } from '@contexts/plant-species/domain/events/plant-species-deleted/plant-species-deleted.event';
import { PlantSpeciesUpdatedEvent } from '@contexts/plant-species/domain/events/plant-species-updated/plant-species-updated.event';
import { PlantSpeciesNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-name/plant-species-name.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';

const PLANT_SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

const buildPlantSpecies = (): PlantSpeciesAggregate =>
  new PlantSpeciesAggregate({
    id: new PlantSpeciesIdValueObject(PLANT_SPECIES_ID),
    name: new PlantSpeciesNameValueObject('Monstera'),
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

  it('update() changes name and emits PlantSpeciesUpdatedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.update({ name: new PlantSpeciesNameValueObject('Basil') });

    expect(plantSpecies.name.value).toBe('Basil');
    const events = plantSpecies.getUncommittedEvents();
    expect(events[0]).toBeInstanceOf(PlantSpeciesUpdatedEvent);
  });

  it('delete() emits PlantSpeciesDeletedEvent', () => {
    const plantSpecies = buildPlantSpecies();
    plantSpecies.delete();

    const events = plantSpecies.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantSpeciesDeletedEvent);
  });

  it('rejects empty name', () => {
    expect(() => new PlantSpeciesNameValueObject('   ')).toThrow();
  });
});
