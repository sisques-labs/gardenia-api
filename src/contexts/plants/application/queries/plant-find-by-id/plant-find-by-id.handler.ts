import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { AssertPlantViewModelExistsService } from '../../services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';

import { PlantFindByIdQuery } from './plant-find-by-id.query';

@QueryHandler(PlantFindByIdQuery)
export class PlantFindByIdQueryHandler implements IQueryHandler<
  PlantFindByIdQuery,
  PlantViewModel
> {
  constructor(
    private readonly assertPlantViewModelExistsService: AssertPlantViewModelExistsService,
  ) {}

  async execute(query: PlantFindByIdQuery): Promise<PlantViewModel> {
    return this.assertPlantViewModelExistsService.execute(query.plantId);
  }
}
