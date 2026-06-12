import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CARE_LOG_ENTRY_READ_REPOSITORY,
  ICareLogEntryReadRepository,
} from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogFindByPlantQuery } from './care-log-find-by-plant.query';

@QueryHandler(CareLogFindByPlantQuery)
export class CareLogFindByPlantQueryHandler implements IQueryHandler<
  CareLogFindByPlantQuery,
  CareLogEntryViewModel[]
> {
  private readonly logger = new Logger(CareLogFindByPlantQueryHandler.name);

  constructor(
    @Inject(CARE_LOG_ENTRY_READ_REPOSITORY)
    private readonly readRepository: ICareLogEntryReadRepository,
  ) {}

  async execute(
    query: CareLogFindByPlantQuery,
  ): Promise<CareLogEntryViewModel[]> {
    this.logger.log(`Finding care log entries for plant: ${query.plantId}`);

    return this.readRepository.findByPlant(query.plantId, {
      page: query.page,
      limit: query.limit,
    });
  }
}
