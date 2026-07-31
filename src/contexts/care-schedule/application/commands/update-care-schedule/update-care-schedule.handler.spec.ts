import { EventBus } from '@nestjs/cqrs';

import { IReminderSchedulerPort } from '@contexts/care-schedule/application/ports/reminder-scheduler.port';
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
  let mockReminderSchedulerPort: jest.Mocked<IReminderSchedulerPort>;

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

    mockReminderSchedulerPort = {
      scheduleReminder: jest.fn().mockResolvedValue(undefined),
      cancelReminder: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IReminderSchedulerPort>;

    handler = new UpdateCareScheduleCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockReminderSchedulerPort,
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

  function buildSchedule(active: boolean, now = new Date()) {
    return new CareScheduleBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withPlantId('110e8400-e29b-41d4-a716-446655440010')
      .withActivityType(CareScheduleActivityTypeEnum.WATERING)
      .withIntervalDays(3)
      .withNextDueAt(now)
      .withActive(active)
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withSpaceId('770e8400-e29b-41d4-a716-446655440002')
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();
  }

  it('cancels the reminder when active flips from true to false', async () => {
    const schedule = buildSchedule(true);
    mockAssert.execute.mockResolvedValue(schedule);

    await handler.execute(
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        active: false,
      }),
    );

    expect(mockReminderSchedulerPort.cancelReminder).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(mockReminderSchedulerPort.scheduleReminder).not.toHaveBeenCalled();
  });

  it('schedules a reminder when active flips from false to true', async () => {
    const schedule = buildSchedule(false);
    mockAssert.execute.mockResolvedValue(schedule);

    await handler.execute(
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        active: true,
      }),
    );

    expect(mockReminderSchedulerPort.scheduleReminder).toHaveBeenCalledTimes(1);
    expect(mockReminderSchedulerPort.cancelReminder).not.toHaveBeenCalled();
  });

  it('does not touch the reminder when active is unchanged', async () => {
    const schedule = buildSchedule(true);
    mockAssert.execute.mockResolvedValue(schedule);

    await handler.execute(
      new UpdateCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        notes: 'watered less in winter',
      }),
    );

    expect(mockReminderSchedulerPort.scheduleReminder).not.toHaveBeenCalled();
    expect(mockReminderSchedulerPort.cancelReminder).not.toHaveBeenCalled();
  });
});
