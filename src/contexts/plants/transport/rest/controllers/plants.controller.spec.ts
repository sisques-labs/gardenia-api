import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantRestMapper } from '../mappers/plant/plant.mapper';
import { CreatePlantDto } from '../dtos/create-plant.dto';
import { PlantsController } from './plants.controller';

describe('PlantsController', () => {
  let controller: PlantsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantRestMapper>;

  const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
  const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
  const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
  const now = new Date('2024-01-01T00:00:00Z');

  const mockVm = new PlantViewModel({
    id: PLANT_ID,
    name: 'Rose',
    species: 'Rosa canina',
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: now,
    updatedAt: now,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn(),
    } as unknown as jest.Mocked<PlantRestMapper>;

    controller = new PlantsController(commandBus, queryBus, mapper);
  });

  it('createPlant dispatches command + re-queries and returns mapped response', async () => {
    commandBus.execute.mockResolvedValueOnce(PLANT_ID);
    queryBus.execute.mockResolvedValueOnce(mockVm);
    mapper.toResponse.mockReturnValueOnce({
      id: PLANT_ID,
      name: 'Rose',
      species: 'Rosa canina',
      imageUrl: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: now,
      updatedAt: now,
    });

    const dto = new CreatePlantDto();
    dto.name = 'Rose';
    dto.species = 'Rosa canina';

    const result = await controller.createPlant(dto, {
      userId: USER_ID,
      email: 'user@example.com',
    });

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(PLANT_ID);
    expect(result.name).toBe('Rose');
  });

  it('getPlant dispatches PlantFindByIdQuery and returns mapped response', async () => {
    queryBus.execute.mockResolvedValueOnce(mockVm);
    mapper.toResponse.mockReturnValueOnce({
      id: PLANT_ID,
      name: 'Rose',
      species: 'Rosa canina',
      imageUrl: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: now,
      updatedAt: now,
    });

    const result = await controller.getPlant(PLANT_ID);

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(PLANT_ID);
  });

  it('deletePlant dispatches DeletePlantCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await controller.deletePlant(PLANT_ID, {
      userId: USER_ID,
      email: 'user@example.com',
    });

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });
});
