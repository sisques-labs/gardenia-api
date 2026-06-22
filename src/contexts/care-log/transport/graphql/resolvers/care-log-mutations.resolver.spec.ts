import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { DeleteCareLogEntryCommand } from '@contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command';
import { UpdateCareLogEntryCommand } from '@contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { CareLogMutationsResolver } from './care-log-mutations.resolver';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('CareLogMutationsResolver', () => {
  let sut: CareLogMutationsResolver;
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
    sut = new CareLogMutationsResolver(commandBus, mapper, spaceContext);
  });

  describe('careLogEntryCreate()', () => {
    it('resolves the space, dispatches CreateCareLogEntryCommand and returns the mapped response', async () => {
      commandBus.execute.mockResolvedValue(ENTRY_ID);

      const result = await sut.careLogEntryCreate(
        {
          plantId: PLANT_ID,
          activityType: CareLogActivityTypeEnum.WATERING,
          performedAt: new Date(),
        } as never,
        user,
      );

      expect(spaceContext.require).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateCareLogEntryCommand),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, id: ENTRY_ID }),
      );
      expect(result).toBe(response);
    });
  });

  describe('careLogEntryUpdate()', () => {
    it('dispatches UpdateCareLogEntryCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.careLogEntryUpdate(
        {
          id: ENTRY_ID,
          activityType: CareLogActivityTypeEnum.PRUNING,
        } as never,
        user,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateCareLogEntryCommand),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(
        expect.objectContaining({ id: ENTRY_ID }),
      );
    });
  });

  describe('careLogEntryDelete()', () => {
    it('dispatches DeleteCareLogEntryCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.careLogEntryDelete(ENTRY_ID, user);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteCareLogEntryCommand),
      );
    });
  });
});
