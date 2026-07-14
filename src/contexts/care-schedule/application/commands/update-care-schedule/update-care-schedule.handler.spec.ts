import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';

import { INotificationDispatcherPort } from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { ICareScheduleWriteRepository } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { UpdateCareScheduleCommand } from './update-care-schedule.command';
import { UpdateCareScheduleCommandHandler } from './update-care-schedule.handler';

describe('UpdateCareScheduleCommandHandler', () => {
  let handler: UpdateCareScheduleCommandHandler;
  let mockWriteRepo: jest.Mocked<ICareScheduleWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockAssert: jest.Mocked<AssertCareScheduleExistsService>;
  let mockNotificationDispatcherPort: jest.Mocked<INotificationDispatcherPort>;
  let mockConfigService: jest.Mocked<ConfigService>;

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

    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertCareScheduleExistsService>;

    mockNotificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<INotificationDispatcherPort>;

    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue({ dueWindowHours: 24 }),
    } as unknown as jest.Mocked<ConfigService>;

    handler = new UpdateCareScheduleCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockNotificationDispatcherPort,
      mockConfigService,
      mockEventBus,
    );
  });

  it('applies the update and persists', async () => {
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
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        intervalDays: 7,
      }),
    );

    expect(schedule.intervalDays?.value).toBe(7);
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
  });

  it('clears intervalDays when null is provided (one-time schedule)', async () => {
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
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        intervalDays: null,
      }),
    );

    expect(schedule.intervalDays).toBeNull();
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
  });

  it('dispatches the current due status to notifications after updating', async () => {
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
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        intervalDays: 7,
      }),
    );

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      referenceId: '550e8400-e29b-41d4-a716-446655440000',
      payload: {
        plantId: '110e8400-e29b-41d4-a716-446655440010',
        activityType: CareScheduleActivityTypeEnum.WATERING,
        nextDueAt: now,
      },
      active: true,
    });
  });

  it('dispatches active:false when the update marks the schedule inactive', async () => {
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
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        active: false,
      }),
    );

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });
});
