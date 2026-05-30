import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  IPlantReadRepository,
  PLANT_READ_REPOSITORY,
} from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import { PlantFindByCriteriaQuery } from './plant-find-by-criteria.query';

@QueryHandler(PlantFindByCriteriaQuery)
export class PlantFindByCriteriaQueryHandler implements IQueryHandler<PlantFindByCriteriaQuery> {
  constructor(
    @Inject(PLANT_READ_REPOSITORY)
    private readonly plantReadRepository: IPlantReadRepository,
  ) {}

  async execute(
    query: PlantFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantViewModel>> {
    return await this.plantReadRepository.findByCriteria(query.criteria);
  }
}
