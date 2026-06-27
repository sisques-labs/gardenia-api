import { EventBus } from '@nestjs/cqrs';

import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { ICareScheduleWriteRepository } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { CompleteCareScheduleCommand } from './complete-care-schedule.command';
import { CompleteCareScheduleCommandHandler } from './complete-care-schedule.handler';

describe('CompleteCareScheduleCommandHandler', () => {
  let handler: CompleteCareScheduleCommandHandler;
  let mockWriteRepo: jest.Mocked<ICareScheduleWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockAssert: jest.Mocked<AssertCareScheduleExistsService>;

  function buildSchedule() {
    const now = new Date('2026-06-27T00:00:00.000Z');
    return new CareScheduleBuilder()
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
  }

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

    handler = new CompleteCareScheduleCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockEventBus,
    );
  });

  it('advances nextDueAt by the interval on completion', async () => {
    const schedule = buildSchedule();
    mockAssert.execute.mockResolvedValue(schedule);

    await handler.execute(
      new CompleteCareScheduleCommand({
        id: '550e8400-e29b-41d4-a716-446655440000',
        completedAt: new Date('2026-06-27T00:00:00.000Z'),
      }),
    );

    expect(schedule.nextDueAt.value).toEqual(
      new Date('2026-06-30T00:00:00.000Z'),
    );
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
  });
});
