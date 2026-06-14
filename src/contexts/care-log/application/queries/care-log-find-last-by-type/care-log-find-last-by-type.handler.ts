import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CARE_LOG_ENTRY_READ_REPOSITORY,
  ICareLogEntryReadRepository,
} from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogFindLastByTypeQuery } from './care-log-find-last-by-type.query';

@QueryHandler(CareLogFindLastByTypeQuery)
export class CareLogFindLastByTypeQueryHandler implements IQueryHandler<
  CareLogFindLastByTypeQuery,
  CareLogEntryViewModel | null
> {
  private readonly logger = new Logger(CareLogFindLastByTypeQueryHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_READ_REPOSITORY)
    private readonly readRepository: ICareLogEntryReadRepository,
  ) {}

  async execute(
    query: CareLogFindLastByTypeQuery,
  ): Promise<CareLogEntryViewModel | null> {
    this.logger.log(
      `Finding last care log entry of type ${query.activityType.value} for plant: ${query.plantId}`,
    );

    return this.readRepository.findLastByType(
      query.plantId.value,
      query.activityType.value,
    );
  }
}
