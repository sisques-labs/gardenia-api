import { ConfigService } from '@nestjs/config';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { INotificationDispatcherPort } from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleNextDueAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-next-due-at/care-schedule-next-due-at.value-object';
import { BooleanValueObject } from '@sisques-labs/nestjs-kit';
import { DispatchCareScheduleDueNotificationService } from './dispatch-care-schedule-due-notification.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildSchedule(nextDueAt: Date): CareScheduleAggregate {
  return new CareScheduleAggregate({
    id: new CareScheduleIdValueObject(ID),
    plantId: new UuidValueObject('110e8400-e29b-41d4-a716-446655440010'),
    activityType: new CareScheduleActivityTypeValueObject(
      CareScheduleActivityTypeEnum.WATERING,
    ),
    intervalDays: new CareScheduleIntervalDaysValueObject(3),
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: new CareScheduleNextDueAtValueObject(nextDueAt),
    lastCompletedAt: null,
    active: new BooleanValueObject(true),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('DispatchCareScheduleDueNotificationService', () => {
  let mockNotificationDispatcherPort: jest.Mocked<INotificationDispatcherPort>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let service: DispatchCareScheduleDueNotificationService;

  beforeEach(() => {
    mockNotificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<INotificationDispatcherPort>;

    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue({ dueWindowHours: 24 }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new DispatchCareScheduleDueNotificationService(
      mockNotificationDispatcherPort,
      mockConfigService,
    );
  });

  it('computes active from isDueWithin(dueWindowHours) when active is not given', async () => {
    const schedule = buildSchedule(new Date(Date.now() + 12 * 60 * 60 * 1000));

    await service.dispatch(schedule);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      referenceId: ID,
      payload: {
        plantId: '110e8400-e29b-41d4-a716-446655440010',
        activityType: CareScheduleActivityTypeEnum.WATERING,
        nextDueAt: schedule.nextDueAt.value,
      },
      active: true,
    });
  });

  it('dispatches active:false when nextDueAt falls outside the window', async () => {
    const schedule = buildSchedule(new Date(Date.now() + 48 * 60 * 60 * 1000));

    await service.dispatch(schedule);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('uses the explicit active flag instead of computing it, when given', async () => {
    const schedule = buildSchedule(new Date(Date.now() - 60_000));

    await service.dispatch(schedule, false);

    expect(mockConfigService.getOrThrow).not.toHaveBeenCalled();
    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });
});
