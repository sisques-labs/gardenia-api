import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { AssertPlantViewModelExistsService } from '@contexts/plants/application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { EnrichPlantWithQrService } from '@contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(PlantFindByIdQuery)
export class PlantFindByIdQueryHandler implements IQueryHandler<
  PlantFindByIdQuery,
  PlantViewModel
> {
  constructor(
    private readonly assertPlantViewModelExistsService: AssertPlantViewModelExistsService,
    private readonly enrichPlantWithQrService: EnrichPlantWithQrService,
  ) {}

  async execute(query: PlantFindByIdQuery): Promise<PlantViewModel> {
    const plant = await this.assertPlantViewModelExistsService.execute(
      query.plantId,
    );
    return this.enrichPlantWithQrService.execute(plant);
  }
}
