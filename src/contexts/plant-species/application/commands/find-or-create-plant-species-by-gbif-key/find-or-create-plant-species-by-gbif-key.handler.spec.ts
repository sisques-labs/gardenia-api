import { EventBus } from '@nestjs/cqrs';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

import { FindOrCreatePlantSpeciesByGbifKeyCommand } from './find-or-create-plant-species-by-gbif-key.command';
import { FindOrCreatePlantSpeciesByGbifKeyCommandHandler } from './find-or-create-plant-species-by-gbif-key.handler';

const EXISTING_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

describe('FindOrCreatePlantSpeciesByGbifKeyCommandHandler', () => {
  let handler: FindOrCreatePlantSpeciesByGbifKeyCommandHandler;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findByGbifKey: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((aggregate) => Promise.resolve(aggregate)),
      delete: jest.fn(),
    } as jest.Mocked<IPlantSpeciesWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new FindOrCreatePlantSpeciesByGbifKeyCommandHandler(
      writeRepository,
      new PlantSpeciesBuilder(),
      eventBus,
    );
  });

  it('returns the existing id when a catalog entry already has the gbifKey', async () => {
    const existing = new PlantSpeciesAggregate({
      id: new PlantSpeciesIdValueObject(EXISTING_ID),
      scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
      gbifKey: new PlantSpeciesGbifKeyValueObject(2882337),
      createdAt: new DateValueObject(NOW),
      updatedAt: new DateValueObject(NOW),
    });
    writeRepository.findByGbifKey.mockResolvedValue(existing);

    const id = await handler.execute(
      new FindOrCreatePlantSpeciesByGbifKeyCommand({
        gbifKey: 2882337,
        scientificName: 'Monstera deliciosa',
      }),
    );

    expect(id).toBe(EXISTING_ID);
    expect(writeRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });

  it('creates a new catalog entry when no entry has the gbifKey', async () => {
    writeRepository.findByGbifKey.mockResolvedValue(null);

    const id = await handler.execute(
      new FindOrCreatePlantSpeciesByGbifKeyCommand({
        gbifKey: 2882337,
        scientificName: 'Monstera deliciosa',
      }),
    );

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        gbifKey: expect.objectContaining({ value: 2882337 }),
        scientificName: expect.objectContaining({
          value: 'Monstera deliciosa',
        }),
      }),
    );
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });
});
