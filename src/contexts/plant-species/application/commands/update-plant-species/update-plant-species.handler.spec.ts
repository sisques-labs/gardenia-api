import { EventBus } from '@nestjs/cqrs';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesNameAlreadyExistsException } from '@contexts/plant-species/domain/exceptions/plant-species-name-already-exists.exception';
import { PlantSpeciesNotFoundException } from '@contexts/plant-species/domain/exceptions/plant-species-not-found.exception';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { AssertPlantSpeciesExistsService } from '@contexts/plant-species/application/services/write/assert-plant-species-exists/assert-plant-species-exists.service';
import { AssertPlantSpeciesNameAvailableService } from '@contexts/plant-species/application/services/write/assert-plant-species-name-available/assert-plant-species-name-available.service';

import { UpdatePlantSpeciesCommand } from './update-plant-species.command';
import { UpdatePlantSpeciesCommandHandler } from './update-plant-species.handler';

const PLANT_SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantSpeciesAggregate =>
  new PlantSpeciesAggregate({
    id: new PlantSpeciesIdValueObject(PLANT_SPECIES_ID),
    scientificName: new PlantSpeciesScientificNameValueObject('Monstera'),
    description: null,
    imageUrl: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('UpdatePlantSpeciesCommandHandler', () => {
  let handler: UpdatePlantSpeciesCommandHandler;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
  let assertExists: jest.Mocked<AssertPlantSpeciesExistsService>;
  let assertNameAvailable: jest.Mocked<AssertPlantSpeciesNameAvailableService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findByScientificName: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((aggregate) => Promise.resolve(aggregate)),
      delete: jest.fn(),
    } as jest.Mocked<IPlantSpeciesWriteRepository>;

    assertExists = {
      execute: jest.fn().mockResolvedValue(buildAggregate()),
    } as unknown as jest.Mocked<AssertPlantSpeciesExistsService>;

    assertNameAvailable = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertPlantSpeciesNameAvailableService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdatePlantSpeciesCommandHandler(
      writeRepository,
      assertExists,
      assertNameAvailable,
      eventBus,
    );
  });

  it('updates scientificName when provided', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Basil',
    });

    await handler.execute(command);

    expect(assertNameAvailable.execute).toHaveBeenCalledTimes(1);
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        scientificName: expect.objectContaining({ value: 'Basil' }),
      }),
    );
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('updates description only', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      description: 'A tropical plant',
    });

    await handler.execute(command);

    expect(assertNameAvailable.execute).not.toHaveBeenCalled();
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.objectContaining({ value: 'A tropical plant' }),
      }),
    );
  });

  it('updates imageUrl only', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      imageUrl: 'https://example.com/img.jpg',
    });

    await handler.execute(command);

    expect(assertNameAvailable.execute).not.toHaveBeenCalled();
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: expect.objectContaining({
          value: 'https://example.com/img.jpg',
        }),
      }),
    );
  });

  it('skips name check when scientificName is not provided', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      description: 'Updated description',
    });

    await handler.execute(command);

    expect(assertNameAvailable.execute).not.toHaveBeenCalled();
  });

  it('publishes events after saving', async () => {
    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Basil',
      description: 'Herb',
      imageUrl: 'https://example.com/basil.jpg',
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

  it('throws PlantSpeciesNameAlreadyExistsException on duplicate scientificName', async () => {
    assertNameAvailable.execute.mockRejectedValue(
      new PlantSpeciesNameAlreadyExistsException('Basil'),
    );

    const command = new UpdatePlantSpeciesCommand({
      id: PLANT_SPECIES_ID,
      scientificName: 'Basil',
    });

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      PlantSpeciesNameAlreadyExistsException,
    );
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
