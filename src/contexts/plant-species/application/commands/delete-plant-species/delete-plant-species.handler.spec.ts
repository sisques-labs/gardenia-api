import { EventBus } from '@nestjs/cqrs';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { AssertPlantSpeciesExistsService } from '@contexts/plant-species/application/services/write/assert-plant-species-exists/assert-plant-species-exists.service';
import { AssertPlantSpeciesNotInUseService } from '@contexts/plant-species/application/services/write/assert-plant-species-not-in-use/assert-plant-species-not-in-use.service';
import { DeletePlantSpeciesCommand } from './delete-plant-species.command';
import { DeletePlantSpeciesCommandHandler } from './delete-plant-species.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('DeletePlantSpeciesCommandHandler', () => {
  let handler: DeletePlantSpeciesCommandHandler;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
  let assertExists: jest.Mocked<AssertPlantSpeciesExistsService>;
  let assertNotInUse: jest.Mocked<AssertPlantSpeciesNotInUseService>;
  let eventBus: jest.Mocked<EventBus>;
  let plantSpecies: jest.Mocked<PlantSpeciesAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    plantSpecies = {
      id: { value: ID },
      delete: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
      commit: jest.fn(),
    } as unknown as jest.Mocked<PlantSpeciesAggregate>;

    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByScientificName: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesWriteRepository>;

    assertExists = {
      execute: jest.fn().mockResolvedValue(plantSpecies),
    } as unknown as jest.Mocked<AssertPlantSpeciesExistsService>;

    assertNotInUse = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertPlantSpeciesNotInUseService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeletePlantSpeciesCommandHandler(
      writeRepository,
      assertExists,
      assertNotInUse,
      eventBus,
    );
  });

  it('asserts existence and non-use, deletes and publishes events', async () => {
    await handler.execute(new DeletePlantSpeciesCommand({ id: ID }));

    expect(assertExists.execute).toHaveBeenCalledTimes(1);
    expect(assertNotInUse.execute).toHaveBeenCalledTimes(1);
    expect(plantSpecies.delete).toHaveBeenCalledTimes(1);
    expect(writeRepository.delete).toHaveBeenCalledWith(ID);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(plantSpecies.commit).toHaveBeenCalledTimes(1);
  });

  it('does not delete when the species is still in use', async () => {
    assertNotInUse.execute.mockRejectedValue(new Error('in use'));

    await expect(
      handler.execute(new DeletePlantSpeciesCommand({ id: ID })),
    ).rejects.toThrow('in use');
    expect(plantSpecies.delete).not.toHaveBeenCalled();
    expect(writeRepository.delete).not.toHaveBeenCalled();
  });
});
