import { IPlantingSpotInUsePort } from '@contexts/planting-spots/application/ports/planting-spot-in-use.port';
import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

@Injectable()
export class PlantingSpotInUseAdapter implements IPlantingSpotInUsePort {
  constructor(private readonly queryBus: QueryBus) {}

  async countByPlantingSpotId(plantingSpotId: string): Promise<number> {
    const criteria = new Criteria(
      [
        {
          field: 'plantingSpotId',
          operator: FilterOperator.EQUALS,
          value: plantingSpotId,
        },
      ],
      undefined,
      undefined,
    );

    const result = await this.queryBus.execute<
      PlantFindByCriteriaQuery,
      PaginatedResult<PlantViewModel>
    >(new PlantFindByCriteriaQuery({ criteria }));

    return result.total;
  }
}
