import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { EnrichPlantWithQrService } from '@contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';
import { EnrichPlantWithSpeciesService } from '@contexts/plants/application/services/read/enrich-plant-with-species/enrich-plant-with-species.service';
import {
  IPlantReadRepository,
  PLANT_READ_REPOSITORY,
} from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

@QueryHandler(PlantFindByCriteriaQuery)
export class PlantFindByCriteriaQueryHandler implements IQueryHandler<PlantFindByCriteriaQuery> {
  constructor(
    @Inject(PLANT_READ_REPOSITORY)
    private readonly plantReadRepository: IPlantReadRepository,
    private readonly enrichPlantWithSpeciesService: EnrichPlantWithSpeciesService,
    private readonly enrichPlantWithQrService: EnrichPlantWithQrService,
  ) {}

  async execute(
    query: PlantFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantViewModel>> {
    const result = await this.plantReadRepository.findByCriteria(
      query.criteria,
    );

    const items = await Promise.all(
      result.items.map(async (plant) => {
        const withSpecies =
          await this.enrichPlantWithSpeciesService.execute(plant);
        return this.enrichPlantWithQrService.execute(withSpecies);
      }),
    );

    return new PaginatedResult(
      items,
      result.total,
      result.page,
      result.perPage,
    );
  }
}
