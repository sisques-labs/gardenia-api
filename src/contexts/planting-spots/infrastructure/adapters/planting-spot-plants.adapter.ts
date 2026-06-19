import { IPlantingSpotPlantsPort } from '@contexts/planting-spots/application/ports/planting-spot-plants.port';
import { PlantingSpotPlantBuilder } from '@contexts/planting-spots/domain/builders/planting-spot-plant.builder';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';
import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Criteria, FilterOperator, PaginatedResult } from '@sisques-labs/nestjs-kit';

@Injectable()
export class PlantingSpotPlantsAdapter implements IPlantingSpotPlantsPort {
  constructor(private readonly queryBus: QueryBus) {}

  async findByPlantingSpotId(
    plantingSpotId: string,
  ): Promise<PlantingSpotPlantViewModel[]> {
    const criteria = new Criteria(
      [
        {
          field: 'plantingSpotId',
          operator: FilterOperator.EQUALS,
          value: plantingSpotId,
        },
      ],
      undefined,
      { page: 1, limit: 500 },
    );

    const result = await this.queryBus.execute<
      PlantFindByCriteriaQuery,
      PaginatedResult<PlantViewModel>
    >(new PlantFindByCriteriaQuery({ criteria }));

    return result.items.map((plant) =>
      PlantingSpotPlantBuilder.buildViewModel({
        id: plant.id,
        name: plant.name,
        plantSpeciesId: plant.plantSpeciesId ?? null,
        imageUrl: plant.imageUrl ?? null,
        userId: plant.userId,
        spaceId: plant.spaceId,
        createdAt: plant.createdAt,
        updatedAt: plant.updatedAt ?? new Date(),
      }),
    );
  }
}
