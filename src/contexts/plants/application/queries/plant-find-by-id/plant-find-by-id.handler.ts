import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { AssertPlantViewModelExistsService } from '../../services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { EnrichPlantWithQrService } from '../../services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';

import { PlantFindByIdQuery } from './plant-find-by-id.query';

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
