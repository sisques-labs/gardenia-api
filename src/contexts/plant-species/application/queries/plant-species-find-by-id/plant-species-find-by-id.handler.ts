import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { AssertPlantSpeciesViewModelExistsService } from '@contexts/plant-species/application/services/read/assert-plant-species-view-model-exists/assert-plant-species-view-model-exists.service';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(PlantSpeciesFindByIdQuery)
export class PlantSpeciesFindByIdQueryHandler implements IQueryHandler<PlantSpeciesFindByIdQuery> {
  constructor(
    private readonly assertPlantSpeciesViewModelExistsService: AssertPlantSpeciesViewModelExistsService,
  ) {}

  async execute(
    query: PlantSpeciesFindByIdQuery,
  ): Promise<PlantSpeciesViewModel> {
    return await this.assertPlantSpeciesViewModelExistsService.execute(
      query.plantSpeciesId,
    );
  }
}
