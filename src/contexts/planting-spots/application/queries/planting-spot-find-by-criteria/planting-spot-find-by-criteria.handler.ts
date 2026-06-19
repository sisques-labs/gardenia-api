import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  IPlantingSpotResolvePlantsPort,
  PLANTING_SPOT_RESOLVE_PLANTS_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-resolve-plants.port';
import {
  IPlantingSpotReadRepository,
  PLANTING_SPOT_READ_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotFindByCriteriaQuery } from './planting-spot-find-by-criteria.query';

@QueryHandler(PlantingSpotFindByCriteriaQuery)
export class PlantingSpotFindByCriteriaQueryHandler
  implements
    IQueryHandler<
      PlantingSpotFindByCriteriaQuery,
      PaginatedResult<PlantingSpotViewModel>
    >
{
  private readonly logger = new Logger(
    PlantingSpotFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(PLANTING_SPOT_READ_REPOSITORY)
    private readonly plantingSpotReadRepository: IPlantingSpotReadRepository,
    @Inject(PLANTING_SPOT_RESOLVE_PLANTS_PORT)
    private readonly resolvePlantsPort: IPlantingSpotResolvePlantsPort,
  ) {}

  async execute(
    query: PlantingSpotFindByCriteriaQuery,
  ): Promise<PaginatedResult<PlantingSpotViewModel>> {
    this.logger.log(
      `Executing PlantingSpotFindByCriteriaQuery (resolve=${query.resolve})`,
    );

    const result = await this.plantingSpotReadRepository.findByCriteria(
      query.criteria,
    );

    if (!query.resolve) return result;

    const enrichedItems = await Promise.all(
      result.items.map(async (vm) => {
        const resolvedPlants =
          await this.resolvePlantsPort.findByPlantingSpotId(vm.id);
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
      }),
    );

    return new PaginatedResult(
      enrichedItems,
      result.total,
      result.page,
      result.perPage,
    );
  }
}
