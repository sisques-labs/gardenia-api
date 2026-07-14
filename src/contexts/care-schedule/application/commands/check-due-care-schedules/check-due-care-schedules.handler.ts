import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/care-schedule/application/ports/notification-dispatcher.port';
import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleQueryableField } from '@contexts/care-schedule/transport/graphql/enums/care-schedule-queryable-field.enum';

import { CheckDueCareSchedulesCommand } from './check-due-care-schedules.command';

const PAGE_SIZE = 100;

@CommandHandler(CheckDueCareSchedulesCommand)
export class CheckDueCareSchedulesCommandHandler implements ICommandHandler<
  CheckDueCareSchedulesCommand,
  void
> {
  private readonly logger = new Logger(
    CheckDueCareSchedulesCommandHandler.name,
  );

  constructor(
    @Inject(CARE_SCHEDULE_READ_REPOSITORY)
    private readonly careScheduleReadRepository: ICareScheduleReadRepository,
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
  ) {}

  async execute(command: CheckDueCareSchedulesCommand): Promise<void> {
    const dueBefore = new Date(
      Date.now() + command.windowHours.value * 60 * 60 * 1000,
    );
    const schedules = await this.fetchAllDue(dueBefore);

    for (const schedule of schedules) {
      await this.notificationDispatcherPort.dispatch({
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

  private async fetchAllDue(dueBefore: Date): Promise<CareScheduleViewModel[]> {
    const results: CareScheduleViewModel[] = [];
    let page = 1;

    for (;;) {
      const criteria = new Criteria(
        [
          {
            field: CareScheduleQueryableField.ACTIVE,
            operator: FilterOperator.EQUALS,
            value: true,
          },
          {
            field: CareScheduleQueryableField.DUE_BEFORE,
            operator: FilterOperator.LESS_THAN_OR_EQUAL,
            value: dueBefore.toISOString(),
          },
        ],
        undefined,
        { page, perPage: PAGE_SIZE },
      );

      const result: PaginatedResult<CareScheduleViewModel> =
        await this.careScheduleReadRepository.findByCriteria(criteria);
      results.push(...result.items);

      if (result.items.length < PAGE_SIZE) break;
      page += 1;
    }

    return results;
  }
}
