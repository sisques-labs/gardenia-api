import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CheckDueCareSchedulesCommand } from './check-due-care-schedules.command';
import { CheckDueCareSchedulesCommandHandler } from './check-due-care-schedules.handler';

function buildDueSchedule(id: string): CareScheduleViewModel {
  return new CareScheduleViewModel({
    id,
    plantId: '110e8400-e29b-41d4-a716-446655440010',
    activityType: CareScheduleActivityTypeEnum.WATERING,
    intervalDays: 3,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: new Date(),
    lastCompletedAt: null,
    active: true,
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CheckDueCareSchedulesCommandHandler', () => {
  let careScheduleReadRepository: { findByCriteria: jest.Mock };
  let notificationDispatcherPort: { dispatch: jest.Mock };
  let handler: CheckDueCareSchedulesCommandHandler;

  beforeEach(() => {
    careScheduleReadRepository = { findByCriteria: jest.fn() };
    notificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CheckDueCareSchedulesCommandHandler(
      careScheduleReadRepository as any,
      notificationDispatcherPort as any,
    );
  });

  it('dispatches active:true for every due schedule found', async () => {
    const schedule = buildDueSchedule('990e8400-e29b-41d4-a716-446655440010');
    careScheduleReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([schedule], 1, 1, 100),
    );

    await handler.execute(
      new CheckDueCareSchedulesCommand({ windowHours: 24 }),
    );

    expect(notificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      referenceId: schedule.id,
      payload: {
        plantId: schedule.plantId,
        activityType: schedule.activityType,
        nextDueAt: schedule.nextDueAt,
      },
      active: true,
    });
  });

  it('does nothing when there are no due schedules', async () => {
    careScheduleReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 100),
    );

    await handler.execute(
      new CheckDueCareSchedulesCommand({ windowHours: 24 }),
    );

    expect(notificationDispatcherPort.dispatch).not.toHaveBeenCalled();
  });

  it('paginates through every page of due schedules', async () => {
    const first = buildDueSchedule('990e8400-e29b-41d4-a716-446655440010');
    const second = buildDueSchedule('990e8400-e29b-41d4-a716-446655440011');
    careScheduleReadRepository.findByCriteria
      .mockResolvedValueOnce(
        new PaginatedResult(new Array(100).fill(first), 101, 1, 100),
      )
      .mockResolvedValueOnce(new PaginatedResult([second], 101, 2, 100));

    await handler.execute(
      new CheckDueCareSchedulesCommand({ windowHours: 24 }),
    );

    expect(careScheduleReadRepository.findByCriteria).toHaveBeenCalledTimes(2);
    expect(notificationDispatcherPort.dispatch).toHaveBeenCalledTimes(101);
  });
});
