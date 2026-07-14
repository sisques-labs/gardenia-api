import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { ICareScheduleConfig } from '@core/config/care-schedule.config';

/**
 * Single place that knows how to tell notifications whether a schedule is
 * currently due. Shared by every care-schedule mutation handler that can
 * change the due condition (complete/update/delete) so the payload shape and
 * the dueWindowHours lookup live in exactly one spot.
 */
@Injectable()
export class DispatchCareScheduleDueNotificationService {
  constructor(
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
    private readonly configService: ConfigService,
  ) {}

  async dispatch(
    schedule: CareScheduleAggregate,
    active?: boolean,
  ): Promise<void> {
    await this.notificationDispatcherPort.dispatch({
      referenceId: schedule.id.value,
      payload: {
        plantId: schedule.plantId.value,
        activityType: schedule.activityType.value,
        nextDueAt: schedule.nextDueAt.value,
      },
      active: active ?? this.isDue(schedule),
    });
  }

  private isDue(schedule: CareScheduleAggregate): boolean {
    const { dueWindowHours } =
      this.configService.getOrThrow<ICareScheduleConfig>('careSchedule');
    return schedule.isDueWithin(dueWindowHours);
  }
}
