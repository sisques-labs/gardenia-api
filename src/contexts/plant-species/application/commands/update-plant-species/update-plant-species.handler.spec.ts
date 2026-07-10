import { EventBus } from '@nestjs/cqrs';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesGbifKeyAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-gbif-key-already-exists.exception';
import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { AssertPlantSpeciesExistsService } from '@contexts/plant-species/application/services/write/assert-plant-species-exists/assert-plant-species-exists.service';
import { AssertPlantSpeciesGbifKeyAvailableService } from '@contexts/plant-species/application/services/write/assert-plant-species-gbif-key-available/assert-plant-species-gbif-key-available.service';

import { UpdatePlantSpeciesCommand } from './update-plant-species.command';
import { UpdatePlantSpeciesCommandHandler } from './update-plant-species.handler';

const PLANT_SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantSpeciesAggregate =>
  new PlantSpeciesAggregate({
    id: new PlantSpeciesIdValueObject(PLANT_SPECIES_ID),
    scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
    gbifKey: new PlantSpeciesGbifKeyValueObject(2882337),
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('UpdatePlantSpeciesCommandHandler', () => {
  let handler: UpdatePlantSpeciesCommandHandler;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
  let assertExists: jest.Mocked<AssertPlantSpeciesExistsService>;
  let assertGbifKeyAvailable: jest.Mocked<AssertPlantSpeciesGbifKeyAvailableService>;
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

    assertExists = {
      execute: jest.fn().mockResolvedValue(buildAggregate()),
    } as unknown as jest.Mocked<AssertPlantSpeciesExistsService>;

    assertGbifKeyAvailable = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertPlantSpeciesGbifKeyAvailableService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdatePlantSpeciesCommandHandler(
      writeRepository,
      assertExists,
      assertGbifKeyAvailable,
      eventBus,
    );
  });

  it('updates scientificName when provided', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Basil',
    });

    await handler.execute(command);

    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        scientificName: expect.objectContaining({ value: 'Basil' }),
      }),
    );
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('updates gbifKey and asserts it is available', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      gbifKey: 5352251,
    });

    await handler.execute(command);

    expect(assertGbifKeyAvailable.execute).toHaveBeenCalledTimes(1);
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        gbifKey: expect.objectContaining({ value: 5352251 }),
      }),
    );
  });

  it('skips gbifKey check when gbifKey is not provided', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Updated name',
    });

    await handler.execute(command);

    expect(assertGbifKeyAvailable.execute).not.toHaveBeenCalled();
  });

  it('publishes events after saving', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Basil',
      gbifKey: 5352251,
    });

    await handler.execute(command);

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws PlantSpeciesNotFoundException when species does not exist', async () => {
    assertExists.execute.mockRejectedValue(
      new PlantSpeciesNotFoundException(PLANT_SPECIES_ID),
    );

    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Basil',
    });

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      PlantSpeciesNotFoundException,
    );
    expect(writeRepository.save).not.toHaveBeenCalled();
  });

  it('throws PlantSpeciesGbifKeyAlreadyExistsException on duplicate gbifKey', async () => {
    assertGbifKeyAvailable.execute.mockRejectedValue(
      new PlantSpeciesGbifKeyAlreadyExistsException(5352251),
    );

    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      gbifKey: 5352251,
    });

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      PlantSpeciesGbifKeyAlreadyExistsException,
    );
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
