import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertCareScheduleViewModelExistsService } from '@contexts/care-schedule/application/services/read/assert-care-schedule-view-model-exists/assert-care-schedule-view-model-exists.service';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

import { CareScheduleFindByIdQuery } from './care-schedule-find-by-id.query';

@QueryHandler(CareScheduleFindByIdQuery)
export class CareScheduleFindByIdQueryHandler implements IQueryHandler<
  CareScheduleFindByIdQuery,
  CareScheduleViewModel
> {
  private readonly logger = new Logger(CareScheduleFindByIdQueryHandler.name);

  constructor(
    private readonly assertCareScheduleViewModelExistsService: AssertCareScheduleViewModelExistsService,
  ) {}

  async execute(
    query: CareScheduleFindByIdQuery,
  ): Promise<CareScheduleViewModel> {
    this.logger.log(
      `Executing CareScheduleFindByIdQuery for schedule ${query.id.value}`,
    );
    return this.assertCareScheduleViewModelExistsService.execute(query.id);
  }
}
