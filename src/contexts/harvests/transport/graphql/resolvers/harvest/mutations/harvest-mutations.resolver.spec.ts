import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CreateHarvestCommand } from '@contexts/harvests/application/commands/create-harvest/create-harvest.command';
import { DeleteHarvestCommand } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.command';
import { UpdateHarvestCommand } from '@contexts/harvests/application/commands/update-harvest/update-harvest.command';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { HarvestMutationsResolver } from './harvest-mutations.resolver';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const HARVEST_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('HarvestMutationsResolver', () => {
  let sut: HarvestMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mapper: jest.Mocked<MutationResponseGraphQLMapper>;
  let spaceContext: jest.Mocked<SpaceContext>;
  const response = { success: true } as MutationResponseDto;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue(response),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;
    sut = new HarvestMutationsResolver(commandBus, mapper, spaceContext);
  });

  it('harvestCreate() resolves the space and dispatches CreateHarvestCommand', async () => {
    commandBus.execute.mockResolvedValue(HARVEST_ID);

    const result = await sut.harvestCreate(
      {
        cropType: 'Tomato',
        quantity: 2.5,
        unit: HarvestUnitEnum.KG,
        harvestedAt: new Date(),
      } as never,
      user,
    );

    expect(spaceContext.require).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateHarvestCommand),
    );
    expect(result).toBe(response);
  });

  it('harvestUpdate() dispatches UpdateHarvestCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.harvestUpdate({ id: HARVEST_ID } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateHarvestCommand),
    );
  });

  it('harvestDelete() dispatches DeleteHarvestCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.harvestDelete({ id: HARVEST_ID } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteHarvestCommand),
    );
  });
});
