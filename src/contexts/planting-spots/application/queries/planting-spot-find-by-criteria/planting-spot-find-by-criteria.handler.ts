import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  IPlantingSpotReadRepository,
  PLANTING_SPOT_READ_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotFindByCriteriaQuery } from './planting-spot-find-by-criteria.query';

@QueryHandler(PlantingSpotFindByCriteriaQuery)
export class PlantingSpotFindByCriteriaQueryHandler
  implements
    IQueryHandler<
      PlantingSpotFindByCriteriaQuery,
      PaginatedResult<PlantingSpotViewModel>
    >
{
  private readonly logger = new Logger(
    PlantingSpotFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(PLANTING_SPOT_READ_REPOSITORY)
    private readonly plantingSpotReadRepository: IPlantingSpotReadRepository,
  ) {}

  async execute(
    query: PlantingSpotFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantingSpotViewModel>> {
    this.logger.log('Executing PlantingSpotFindByCriteriaQuery');
    return this.plantingSpotReadRepository.findByCriteria(query.criteria);
  }
}
