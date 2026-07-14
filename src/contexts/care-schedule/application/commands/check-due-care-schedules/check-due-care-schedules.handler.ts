import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import { FindAllDueCareSchedulesService } from '@contexts/care-schedule/application/services/read/find-all-due-care-schedules/find-all-due-care-schedules.service';
import { CareScheduleNotificationTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-notification-type.enum';

import { CheckDueCareSchedulesCommand } from './check-due-care-schedules.command';

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
      Date.now() + command.windowHours.value * 60 * 60 * 1000,
    );
    const schedules = await this.findAllDueCareSchedulesService.execute({
      dueBefore,
    });

    for (const schedule of schedules) {
      await this.notificationDispatcherPort.dispatch({
        type: CareScheduleNotificationTypeEnum.DUE,
        referenceId: schedule.id,
        payload: {
          plantId: schedule.plantId,
          activityType: schedule.activityType,
          nextDueAt: schedule.nextDueAt,
        },
        active: true,
      });
    }

    this.logger.log(
      `Checked due care schedules within ${command.windowHours.value}h: ${schedules.length} due`,
    );
  }
}
