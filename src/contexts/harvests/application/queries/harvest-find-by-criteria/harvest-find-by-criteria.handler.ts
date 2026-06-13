import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  HARVEST_READ_REPOSITORY,
  IHarvestReadRepository,
} from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

import { HarvestFindByCriteriaQuery } from './harvest-find-by-criteria.query';

@QueryHandler(HarvestFindByCriteriaQuery)
export class HarvestFindByCriteriaQueryHandler implements IQueryHandler<
  HarvestFindByCriteriaQuery,
  PaginatedResult<HarvestViewModel>
> {
  private readonly logger = new Logger(HarvestFindByCriteriaQueryHandler.name);

  constructor(
    @Inject(HARVEST_READ_REPOSITORY)
    private readonly harvestReadRepository: IHarvestReadRepository,
  ) {}

  async execute(
    query: HarvestFindByCriteriaQuery,
  ): Promise<PaginatedResult<HarvestViewModel>> {
    this.logger.log('Executing HarvestFindByCriteriaQuery');
    return this.harvestReadRepository.findByCriteria(query.criteria);
  }
}
