import { CommandBus } from '@nestjs/cqrs';

import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { PlantsAdapter } from './plants.adapter';

describe('PlantsAdapter', () => {
  let commandBus: jest.Mocked<CommandBus>;
  let adapter: PlantsAdapter;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    adapter = new PlantsAdapter(commandBus);
  });

  it('createPlant() dispatches CreatePlantCommand and wraps the id', async () => {
    commandBus.execute.mockResolvedValue('plant-1');

    const result = await adapter.createPlant({
      name: 'My Monstera',
      gbifSpeciesKey: 2882337,
      speciesScientificName: 'Monstera deliciosa',
      imageUrl: null,
      userId: '660e8400-e29b-41d4-a716-446655440001',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantCommand),
    );
    expect(result).toEqual({ id: 'plant-1' });
  });
});
