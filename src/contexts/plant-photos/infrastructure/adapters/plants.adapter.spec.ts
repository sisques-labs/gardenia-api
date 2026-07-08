import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantsAdapter } from './plants.adapter';

const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('PlantsAdapter', () => {
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let adapter: PlantsAdapter;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantsAdapter(commandBus, queryBus);
  });

  it('getImageUrl() returns the plant imageUrl', async () => {
    queryBus.execute.mockResolvedValue({
      imageUrl: '/api/files/x/content',
    } as PlantViewModel);

    const result = await adapter.getImageUrl(PLANT_ID);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantFindByIdQuery),
    );
    expect(result).toBe('/api/files/x/content');
  });

  it('getImageUrl() returns null when the plant query rejects', async () => {
    queryBus.execute.mockRejectedValue(new Error('not found'));

    const result = await adapter.getImageUrl(PLANT_ID);

    expect(result).toBeNull();
  });

  it('updateImageUrl() dispatches UpdatePlantCommand', async () => {
    await adapter.updateImageUrl(PLANT_ID, '/api/files/x/content', USER_ID);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePlantCommand),
    );
  });

  it('updateImageUrl() propagates rejection to the caller', async () => {
    commandBus.execute.mockRejectedValue(new Error('plant not found'));

    await expect(
      adapter.updateImageUrl(PLANT_ID, null, USER_ID),
    ).rejects.toThrow('plant not found');
  });
});
