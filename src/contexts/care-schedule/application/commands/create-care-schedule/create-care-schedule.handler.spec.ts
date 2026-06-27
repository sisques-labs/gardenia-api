import { EventBus } from '@nestjs/cqrs';

import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { ICareScheduleWriteRepository } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { CreateCareScheduleCommand } from './create-care-schedule.command';
import { CreateCareScheduleCommandHandler } from './create-care-schedule.handler';

describe('CreateCareScheduleCommandHandler', () => {
  let handler: CreateCareScheduleCommandHandler;
  let mockWriteRepo: jest.Mocked<ICareScheduleWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareScheduleWriteRepository>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateCareScheduleCommandHandler(
      mockWriteRepo,
      new CareScheduleBuilder(),
      mockEventBus,
    );
  });

  it('saves a care schedule and returns its id', async () => {
    const command = new CreateCareScheduleCommand({
      plantId: '110e8400-e29b-41d4-a716-446655440010',
      activityType: CareScheduleActivityTypeEnum.WATERING,
      intervalDays: 3,
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
    });

    const result = await handler.execute(command);

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(36);
  });

  it('throws when intervalDays is below one', () => {
    expect(
      () =>
        new CreateCareScheduleCommand({
          plantId: '110e8400-e29b-41d4-a716-446655440010',
          activityType: CareScheduleActivityTypeEnum.WATERING,
          intervalDays: 0,
          userId: '660e8400-e29b-41d4-a716-446655440001',
          spaceId: '770e8400-e29b-41d4-a716-446655440002',
        }),
    ).toThrow();
  });
});
