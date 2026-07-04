import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { CareScheduleMutationsResolver } from './care-schedule-mutations.resolver';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('CareScheduleMutationsResolver', () => {
  let sut: CareScheduleMutationsResolver;
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
    sut = new CareScheduleMutationsResolver(commandBus, mapper, spaceContext);
  });

  it('careScheduleCreate() resolves the space and dispatches CreateCareScheduleCommand', async () => {
    commandBus.execute.mockResolvedValue(SCHEDULE_ID);

    const result = await sut.careScheduleCreate(
      {
        plantId: PLANT_ID,
        activityType: CareScheduleActivityTypeEnum.WATERING,
        intervalDays: 3,
      } as never,
      user,
    );

    expect(spaceContext.require).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateCareScheduleCommand),
    );
    expect(result).toBe(response);
  });

  it('careScheduleUpdate() dispatches UpdateCareScheduleCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);
    await sut.careScheduleUpdate({ id: SCHEDULE_ID } as never);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateCareScheduleCommand),
    );
  });

  it('careScheduleComplete() dispatches CompleteCareScheduleCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);
    await sut.careScheduleComplete({ id: SCHEDULE_ID } as never);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CompleteCareScheduleCommand),
    );
  });

  it('careScheduleWaterPlant() resolves the space and dispatches WaterPlantCommand', async () => {
    const waterResult = { plantId: PLANT_ID, mode: 'CARE_LOG_CREATED' };
    commandBus.execute.mockResolvedValue(waterResult);

    const result = await sut.careScheduleWaterPlant(
      { plantId: PLANT_ID } as never,
      user,
    );

    expect(spaceContext.require).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(WaterPlantCommand),
    );
    expect(result).toBe(waterResult);
  });

  it('careScheduleDelete() dispatches DeleteCareScheduleCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);
    await sut.careScheduleDelete(SCHEDULE_ID);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteCareScheduleCommand),
    );
  });
});
