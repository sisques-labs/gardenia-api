import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

import { CareScheduleFindByCriteriaQuery } from './care-schedule-find-by-criteria.query';

@QueryHandler(CareScheduleFindByCriteriaQuery)
export class CareScheduleFindByCriteriaQueryHandler implements IQueryHandler<
  CareScheduleFindByCriteriaQuery,
  PaginatedResult<CareScheduleViewModel>
> {
  private readonly logger = new Logger(
    CareScheduleFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(CARE_SCHEDULE_READ_REPOSITORY)
    private readonly careScheduleReadRepository: ICareScheduleReadRepository,
  ) {}

  async execute(
    query: CareScheduleFindByCriteriaQuery,
  ): Promise<PaginatedResult<CareScheduleViewModel>> {
    this.logger.log('Executing CareScheduleFindByCriteriaQuery');
    return this.careScheduleReadRepository.findByCriteria(query.criteria);
  }
}
