import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IPlantingSpotResolvePlantsPort,
  PLANTING_SPOT_RESOLVE_PLANTS_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-resolve-plants.port';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { AssertPlantingSpotViewModelExistsService } from '../../services/read/assert-planting-spot-view-model-exists/assert-planting-spot-view-model-exists.service';

import { PlantingSpotFindByIdQuery } from './planting-spot-find-by-id.query';

@QueryHandler(PlantingSpotFindByIdQuery)
export class PlantingSpotFindByIdQueryHandler
  implements IQueryHandler<PlantingSpotFindByIdQuery, PlantingSpotViewModel>
{
  private readonly logger = new Logger(PlantingSpotFindByIdQueryHandler.name);

  constructor(
    private readonly assertPlantingSpotViewModelExistsService: AssertPlantingSpotViewModelExistsService,
    @Inject(PLANTING_SPOT_RESOLVE_PLANTS_PORT)
    private readonly resolvePlantsPort: IPlantingSpotResolvePlantsPort,
  ) {}

  async execute(
    query: PlantingSpotFindByIdQuery,
  ): Promise<PlantingSpotViewModel> {
    this.logger.log(
      `Executing PlantingSpotFindByIdQuery for spot ${query.id.value} (resolve=${query.resolve})`,
    );

    const vm =
      await this.assertPlantingSpotViewModelExistsService.execute(query.id);

    if (!query.resolve) return vm;

    const resolvedPlants = await this.resolvePlantsPort.findByPlantingSpotId(
      query.id.value,
    );

    return new PlantingSpotViewModel({
      id: vm.id,
      name: vm.name,
      type: vm.type,
      description: vm.description,
      capacity: vm.capacity,
      row: vm.row,
      column: vm.column,
      dimensions: vm.dimensions,
      soilType: vm.soilType,
      userId: vm.userId,
      spaceId: vm.spaceId,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
      resolvedPlants,
    });
  }
}
