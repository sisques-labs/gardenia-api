import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleNotificationTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-notification-type.enum';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { FindAllDueCareSchedulesService } from '@contexts/care-schedule/application/services/read/find-all-due-care-schedules/find-all-due-care-schedules.service';
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
  let mockFindAllDueCareSchedulesService: jest.Mocked<FindAllDueCareSchedulesService>;
  let notificationDispatcherPort: { dispatch: jest.Mock };
  let handler: CheckDueCareSchedulesCommandHandler;

  beforeEach(() => {
    mockFindAllDueCareSchedulesService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindAllDueCareSchedulesService>;
    notificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CheckDueCareSchedulesCommandHandler(
      mockFindAllDueCareSchedulesService,
      notificationDispatcherPort as any,
    );
  });

  it('dispatches active:true for every due schedule found', async () => {
    const schedule = buildDueSchedule('990e8400-e29b-41d4-a716-446655440010');
    mockFindAllDueCareSchedulesService.execute.mockResolvedValue([schedule]);

    await handler.execute(
      new CheckDueCareSchedulesCommand({ windowHours: 24 }),
    );

    expect(notificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      type: CareScheduleNotificationTypeEnum.DUE,
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
    mockFindAllDueCareSchedulesService.execute.mockResolvedValue([]);

    await handler.execute(
      new CheckDueCareSchedulesCommand({ windowHours: 24 }),
    );

    expect(notificationDispatcherPort.dispatch).not.toHaveBeenCalled();
  });

  it('asks the service for schedules due within the configured window', async () => {
    mockFindAllDueCareSchedulesService.execute.mockResolvedValue([]);

    await handler.execute(
      new CheckDueCareSchedulesCommand({ windowHours: 24 }),
    );

    expect(mockFindAllDueCareSchedulesService.execute).toHaveBeenCalledWith({
      dueBefore: expect.any(Date),
    });
  });
});
