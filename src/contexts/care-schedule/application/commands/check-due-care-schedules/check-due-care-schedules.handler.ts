import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { FindAllDueCareSchedulesService } from '@contexts/care-schedule/application/services/read/find-all-due-care-schedules/find-all-due-care-schedules.service';
import { CareScheduleNotificationTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-notification-type.enum';
import { runWithConcurrency } from '@shared/concurrency/run-with-concurrency.util';
import { MS_PER_HOUR } from '@shared/time/time.constants';

import { CheckDueCareSchedulesCommand } from './check-due-care-schedules.command';

const DISPATCH_CONCURRENCY = 10;

@CommandHandler(CheckDueCareSchedulesCommand)
export class CheckDueCareSchedulesCommandHandler implements ICommandHandler<
  CheckDueCareSchedulesCommand,
  void
> {
  private readonly logger = new Logger(
    CheckDueCareSchedulesCommandHandler.name,
  );

  constructor(
    private readonly findAllDueCareSchedulesService: FindAllDueCareSchedulesService,
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
  ) {}

  async execute(command: CheckDueCareSchedulesCommand): Promise<void> {
    const dueBefore = new Date(
      Date.now() + command.windowHours.value * MS_PER_HOUR,
    );
    const schedules = await this.findAllDueCareSchedulesService.execute({
      dueBefore,
    });

    await runWithConcurrency(
      schedules,
      (schedule) =>
        this.notificationDispatcherPort.dispatch({
          type: CareScheduleNotificationTypeEnum.DUE,
          referenceId: schedule.id,
          payload: {
            plantId: schedule.plantId,
            activityType: schedule.activityType,
            nextDueAt: schedule.nextDueAt,
          },
          active: true,
        }),
      DISPATCH_CONCURRENCY,
    );

    this.logger.log(
      `Checked due care schedules within ${command.windowHours.value}h: ${schedules.length} due`,
    );
  }
}
