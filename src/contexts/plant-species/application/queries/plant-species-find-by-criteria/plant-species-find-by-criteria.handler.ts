import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesFindByCriteriaQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.query';
import {
  IPlantSpeciesReadRepository,
  PLANT_SPECIES_READ_REPOSITORY,
} from '@contexts/plant-species/domain/repositories/read/plant-species-read.repository';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

@QueryHandler(PlantSpeciesFindByCriteriaQuery)
export class PlantSpeciesFindByCriteriaQueryHandler implements IQueryHandler<PlantSpeciesFindByCriteriaQuery> {
  constructor(
    @Inject(PLANT_SPECIES_READ_REPOSITORY)
    private readonly plantSpeciesReadRepository: IPlantSpeciesReadRepository,
  ) {}

  async execute(
    query: PlantSpeciesFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantSpeciesViewModel>> {
    return await this.plantSpeciesReadRepository.findByCriteria(query.criteria);
  }
}
