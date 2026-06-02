import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { AssertPlantingSpotViewModelExistsService } from '../../services/read/assert-planting-spot-view-model-exists/assert-planting-spot-view-model-exists.service';

import { PlantingSpotFindByIdQuery } from './planting-spot-find-by-id.query';

@QueryHandler(PlantingSpotFindByIdQuery)
export class PlantingSpotFindByIdQueryHandler implements IQueryHandler<
  PlantingSpotFindByIdQuery,
  PlantingSpotViewModel
> {
  private readonly logger = new Logger(PlantingSpotFindByIdQueryHandler.name);

  constructor(
    private readonly assertPlantingSpotViewModelExistsService: AssertPlantingSpotViewModelExistsService,
  ) {}

  async execute(
    query: PlantingSpotFindByIdQuery,
  ): Promise<PlantingSpotViewModel> {
    this.logger.log(
      `Executing PlantingSpotFindByIdQuery for spot ${query.spotId.value}`,
    );

    return this.assertPlantingSpotViewModelExistsService.execute(
      query.spotId,
      query.spaceId.value,
    );
  }
}
