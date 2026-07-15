import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleNotificationTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-notification-type.enum';
import { ICareScheduleConfig } from '@core/config/care-schedule.config';

export interface DispatchCareScheduleDueNotificationServiceInput {
  schedule: CareScheduleAggregate;
  active?: boolean;
}

/**
 * Single place that knows how to tell notifications whether a schedule is
 * currently due. Shared by every care-schedule mutation handler that can
 * change the due condition (complete/update/delete) so the payload shape and
 * the dueWindowHours lookup live in exactly one spot.
 */
@Injectable()
export class DispatchCareScheduleDueNotificationService implements IBaseService<
  DispatchCareScheduleDueNotificationServiceInput,
  void
> {
  constructor(
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: DispatchCareScheduleDueNotificationServiceInput,
  ): Promise<void> {
    const { schedule } = input;

    await this.notificationDispatcherPort.dispatch({
      type: CareScheduleNotificationTypeEnum.DUE,
      referenceId: schedule.id.value,
      payload: {
        plantId: schedule.plantId.value,
        activityType: schedule.activityType.value,
        nextDueAt: schedule.nextDueAt.value,
      },
      active: input.active ?? this.isDue(schedule),
    });
  }

  private isDue(schedule: CareScheduleAggregate): boolean {
    const { dueWindowHours } =
      this.configService.getOrThrow<ICareScheduleConfig>('careSchedule');
    return schedule.isDueWithin(dueWindowHours);
  }
}
