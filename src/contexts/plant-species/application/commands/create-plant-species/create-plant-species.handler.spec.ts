import { EventBus } from '@nestjs/cqrs';

import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { AssertPlantSpeciesNameAvailableService } from '@contexts/plant-species/application/services/write/assert-plant-species-name-available/assert-plant-species-name-available.service';

import { CreatePlantSpeciesCommand } from './create-plant-species.command';
import { CreatePlantSpeciesCommandHandler } from './create-plant-species.handler';

describe('CreatePlantSpeciesCommandHandler', () => {
  let handler: CreatePlantSpeciesCommandHandler;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
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

    assertNameAvailable = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertPlantSpeciesNameAvailableService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreatePlantSpeciesCommandHandler(
      writeRepository,
      assertNameAvailable,
      new PlantSpeciesBuilder(),
      eventBus,
    );
  });

  it('returns a valid UUID', async () => {
    const command = new CreatePlantSpeciesCommand({
      scientificName: 'Monstera',
    });

    const id = await handler.execute(command);

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('asserts scientificName is globally available', async () => {
    const command = new CreatePlantSpeciesCommand({
      scientificName: 'Monstera',
    });

    await handler.execute(command);

    expect(assertNameAvailable.execute).toHaveBeenCalledTimes(1);
  });

  it('saves the aggregate', async () => {
    const command = new CreatePlantSpeciesCommand({
      scientificName: 'Monstera',
    });

    await handler.execute(command);

    expect(writeRepository.save).toHaveBeenCalledWith(expect.any(Object));
  });

  it('publishes events after saving', async () => {
    const command = new CreatePlantSpeciesCommand({
      scientificName: 'Monstera',
    });

    await handler.execute(command);

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });
});
