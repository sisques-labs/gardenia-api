import { Inject, Injectable } from '@nestjs/common';
import {
  Criteria,
  FilterOperator,
  IBaseService,
} from '@sisques-labs/nestjs-kit';

import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleQueryableField } from '@contexts/care-schedule/transport/graphql/enums/care-schedule-queryable-field.enum';
import { fetchAllPages } from '@shared/pagination/fetch-all-pages.util';

export interface FindAllDueCareSchedulesServiceInput {
  dueBefore: Date;
}

/**
 * Pages through every active care schedule due before the given instant.
 * Used by the due-reconciliation cron, which must sweep the whole space
 * regardless of how many schedules are due.
 */
@Injectable()
export class FindAllDueCareSchedulesService implements IBaseService<
  FindAllDueCareSchedulesServiceInput,
  CareScheduleViewModel[]
> {
  constructor(
    @Inject(CARE_SCHEDULE_READ_REPOSITORY)
    private readonly careScheduleReadRepository: ICareScheduleReadRepository,
  ) {}

  async execute(
    input: FindAllDueCareSchedulesServiceInput,
  ): Promise<CareScheduleViewModel[]> {
    return fetchAllPages((page, perPage) => {
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
            value: input.dueBefore.toISOString(),
          },
        ],
        undefined,
        { page, perPage },
      );
      return this.careScheduleReadRepository.findByCriteria(criteria);
    });
  }
}
