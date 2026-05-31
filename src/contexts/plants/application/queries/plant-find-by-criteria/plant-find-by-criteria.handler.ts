import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  IPlantReadRepository,
  PLANT_READ_REPOSITORY,
} from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import { EnrichPlantWithQrService } from '../../services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';
import { PlantFindByCriteriaQuery } from './plant-find-by-criteria.query';

@QueryHandler(PlantFindByCriteriaQuery)
export class PlantFindByCriteriaQueryHandler implements IQueryHandler<PlantFindByCriteriaQuery> {
  constructor(
    @Inject(PLANT_READ_REPOSITORY)
    private readonly plantReadRepository: IPlantReadRepository,
    private readonly enrichPlantWithQrService: EnrichPlantWithQrService,
  ) {}

  async execute(
    query: PlantFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantViewModel>> {
    const result = await this.plantReadRepository.findByCriteria(
      query.criteria,
    );

    const items = await Promise.all(
      result.items.map((plant) => this.enrichPlantWithQrService.execute(plant)),
    );

    return new PaginatedResult(
      items,
      result.total,
      result.page,
      result.perPage,
    );
  }
}
