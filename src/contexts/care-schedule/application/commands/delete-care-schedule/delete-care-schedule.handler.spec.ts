import { EventBus } from '@nestjs/cqrs';

import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { DispatchCareScheduleDueNotificationService } from '@contexts/care-schedule/application/services/write/dispatch-care-schedule-due-notification/dispatch-care-schedule-due-notification.service';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { ICareScheduleWriteRepository } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { DeleteCareScheduleCommand } from './delete-care-schedule.command';
import { DeleteCareScheduleCommandHandler } from './delete-care-schedule.handler';

describe('DeleteCareScheduleCommandHandler', () => {
  let handler: DeleteCareScheduleCommandHandler;
  let mockWriteRepo: jest.Mocked<ICareScheduleWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockAssert: jest.Mocked<AssertCareScheduleExistsService>;
  let mockDispatchCareScheduleDueNotificationService: jest.Mocked<DispatchCareScheduleDueNotificationService>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareScheduleWriteRepository>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertCareScheduleExistsService>;

    mockDispatchCareScheduleDueNotificationService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DispatchCareScheduleDueNotificationService>;

    handler = new DeleteCareScheduleCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockDispatchCareScheduleDueNotificationService,
      mockEventBus,
    );
  });

  it('deletes an existing schedule', async () => {
    const now = new Date();
    const schedule = new CareScheduleBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withPlantId('110e8400-e29b-41d4-a716-446655440010')
      .withActivityType(CareScheduleActivityTypeEnum.WATERING)
      .withIntervalDays(3)
      .withNextDueAt(now)
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withSpaceId('770e8400-e29b-41d4-a716-446655440002')
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();
    mockAssert.execute.mockResolvedValue(schedule);

    await handler.execute(
      new DeleteCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    );

    expect(mockWriteRepo.delete).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('dispatches active:false so any open notification for it gets resolved', async () => {
    const now = new Date();
    const schedule = new CareScheduleBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withPlantId('110e8400-e29b-41d4-a716-446655440010')
      .withActivityType(CareScheduleActivityTypeEnum.WATERING)
      .withIntervalDays(3)
      .withNextDueAt(now)
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withSpaceId('770e8400-e29b-41d4-a716-446655440002')
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();
    mockAssert.execute.mockResolvedValue(schedule);

    await handler.execute(
      new DeleteCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    );

    expect(
      mockDispatchCareScheduleDueNotificationService.execute,
    ).toHaveBeenCalledWith({ schedule, active: false });
  });
});
