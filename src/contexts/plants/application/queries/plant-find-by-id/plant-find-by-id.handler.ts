import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { AssertPlantViewModelExistsService } from '@contexts/plants/application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(PlantFindByIdQuery)
export class PlantFindByIdQueryHandler implements IQueryHandler<
  PlantFindByIdQuery,
  PlantViewModel
> {
  private readonly logger = new Logger(PlantFindByIdQueryHandler.name);

  constructor(
    private readonly assertPlantViewModelExistsService: AssertPlantViewModelExistsService,
  ) {}

  async execute(query: PlantFindByIdQuery): Promise<PlantViewModel> {
    this.logger.log(
      `Executing PlantFindByIdQuery for plant ${query.plantId.value}`,
    );

    return this.assertPlantViewModelExistsService.execute(query.plantId);
  }
}
