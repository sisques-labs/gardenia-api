import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  CARE_LOG_ENTRY_READ_REPOSITORY,
  ICareLogEntryReadRepository,
} from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogFindByCriteriaQuery } from './care-log-find-by-criteria.query';

@QueryHandler(CareLogFindByCriteriaQuery)
export class CareLogFindByCriteriaQueryHandler implements IQueryHandler<
  CareLogFindByCriteriaQuery,
  PaginatedResult<CareLogEntryViewModel>
> {
  private readonly logger = new Logger(CareLogFindByCriteriaQueryHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_READ_REPOSITORY)
    private readonly readRepository: ICareLogEntryReadRepository,
  ) {}

  async execute(
    query: CareLogFindByCriteriaQuery,
  ): Promise<PaginatedResult<CareLogEntryViewModel>> {
    this.logger.log('Finding care log entries by criteria');
    return this.readRepository.findByCriteria(query.criteria);
  }
}
