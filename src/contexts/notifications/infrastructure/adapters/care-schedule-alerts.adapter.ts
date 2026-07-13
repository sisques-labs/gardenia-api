import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { ICareScheduleAlertsPort } from '@contexts/notifications/application/ports/care-schedule-alerts.port';
import { IDueCareSchedule } from '@contexts/notifications/application/ports/due-care-schedule.interface';
import { CareScheduleFindByCriteriaQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.query';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

const PAGE_SIZE = 100;

@Injectable()
export class CareScheduleAlertsAdapter implements ICareScheduleAlertsPort {
  private readonly logger = new Logger(CareScheduleAlertsAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async findDueWithin(windowHours: number): Promise<IDueCareSchedule[]> {
    const dueBefore = new Date(Date.now() + windowHours * 60 * 60 * 1000);
    const results: IDueCareSchedule[] = [];
    let page = 1;

    for (;;) {
      const criteria = new Criteria(
        [
          { field: 'active', operator: FilterOperator.EQUALS, value: true },
          {
            field: 'due_before',
            operator: FilterOperator.LESS_THAN_OR_EQUAL,
            value: dueBefore.toISOString(),
          },
        ],
        [],
        { page, perPage: PAGE_SIZE },
      );

      const result: PaginatedResult<CareScheduleViewModel> =
        await this.queryBus.execute(
          new CareScheduleFindByCriteriaQuery(criteria),
        );

      results.push(
        ...result.items.map((schedule) => ({
          scheduleId: schedule.id,
          plantId: schedule.plantId,
          activityType: schedule.activityType,
          nextDueAt: schedule.nextDueAt,
        })),
      );

      if (result.items.length < PAGE_SIZE) break;
      page += 1;
    }

    this.logger.log(
      `Found ${results.length} due care schedules within ${windowHours}h`,
    );
    return results;
  }
}
