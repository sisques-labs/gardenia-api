import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CARE_LOG_ENTRY_READ_REPOSITORY,
  ICareLogEntryReadRepository,
} from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogFindBySpaceQuery } from './care-log-find-by-space.query';

@QueryHandler(CareLogFindBySpaceQuery)
export class CareLogFindBySpaceQueryHandler implements IQueryHandler<
  CareLogFindBySpaceQuery,
  CareLogEntryViewModel[]
> {
  private readonly logger = new Logger(CareLogFindBySpaceQueryHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_READ_REPOSITORY)
    private readonly readRepository: ICareLogEntryReadRepository,
  ) {}

  async execute(
    query: CareLogFindBySpaceQuery,
  ): Promise<CareLogEntryViewModel[]> {
    this.logger.log('Finding care log entries by space criteria');

    return this.readRepository.findBySpace({
      activityTypes: query.activityTypes,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: query.page,
      limit: query.limit,
    });
  }
}
