import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { DeletePlantCommand } from '@contexts/plants/application/commands/delete-plant/delete-plant.command';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { PlantMutationsResolver } from './plant-mutations.resolver';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('PlantMutationsResolver', () => {
  let sut: PlantMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mapper: jest.Mocked<MutationResponseGraphQLMapper>;
  const response = { success: true } as MutationResponseDto;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue(response),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    sut = new PlantMutationsResolver(commandBus, mapper);
  });

  it('plantCreate() dispatches CreatePlantCommand and returns the mapped response', async () => {
    commandBus.execute.mockResolvedValue(PLANT_ID);

    const result = await sut.plantCreate({ name: 'Aloe' } as never, user);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantCommand),
    );
    expect(mapper.toResponseDto).toHaveBeenCalledWith(
      expect.objectContaining({ id: PLANT_ID }),
    );
    expect(result).toBe(response);
  });

  it('plantUpdate() dispatches UpdatePlantCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.plantUpdate({ id: PLANT_ID, name: 'Aloe vera' } as never, user);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePlantCommand),
    );
  });

  it('plantDelete() dispatches DeletePlantCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.plantDelete({ id: PLANT_ID } as never, user);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeletePlantCommand),
    );
  });
});
