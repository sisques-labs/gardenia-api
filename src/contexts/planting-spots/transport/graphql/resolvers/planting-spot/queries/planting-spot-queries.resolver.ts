import { Inject, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  IPlantingSpotPlantsPort,
  PLANTING_SPOT_PLANTS_PORT,
} from '@contexts/planting-spots/application/ports/planting-spot-plants.port';
import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotFindByCriteriaRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-find-by-criteria.request.dto';
import { PlantingSpotFindByIdRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-find-by-id.request.dto';
import {
  PaginatedPlantingSpotResultDto,
  PlantingSpotResponseDto,
} from '@contexts/planting-spots/transport/graphql/dtos/responses/planting-spot.response.dto';
import { PlantingSpotGraphQLMapper } from '@contexts/planting-spots/transport/graphql/mappers/planting-spot/planting-spot.mapper';

@Resolver()
export class PlantingSpotQueriesResolver {
  private readonly logger = new Logger(PlantingSpotQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantingSpotGraphQLMapper: PlantingSpotGraphQLMapper,
    @Inject(PLANTING_SPOT_PLANTS_PORT)
    private readonly plantingSpotPlantsPort: IPlantingSpotPlantsPort,
  ) {}

  @Query(() => PaginatedPlantingSpotResultDto)
  async plantingSpotsFindByCriteria(
    @Args('input', { nullable: true })
    input?: PlantingSpotFindByCriteriaRequestDto,
    @Args('resolve', { nullable: true, type: () => Boolean })
    resolve?: boolean,
  ): Promise<PaginatedPlantingSpotResultDto> {
    this.logger.log(
      `Finding planting spots by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute<
      PlantingSpotFindByCriteriaQuery,
      PaginatedResult<PlantingSpotViewModel>
    >(new PlantingSpotFindByCriteriaQuery({ criteria }));

    if (!resolve) {
      return this.plantingSpotGraphQLMapper.toPaginatedResponseDto(result);
    }

    const resolvedPlantsMap = new Map<string, PlantingSpotPlantViewModel[]>();
    await Promise.all(
      result.items.map(async (vm) => {
        const plants = await this.plantingSpotPlantsPort.findByPlantingSpotId(vm.id);
        resolvedPlantsMap.set(vm.id, plants);
      }),
    );

    return this.plantingSpotGraphQLMapper.toPaginatedResponseDto(result, resolvedPlantsMap);
  }

  @Query(() => PlantingSpotResponseDto, { nullable: true })
  async plantingSpotFindById(
    @Args('input') input: PlantingSpotFindByIdRequestDto,
  ): Promise<PlantingSpotResponseDto | null> {
    this.logger.log(`Finding planting spot by id: ${input.id}`);

    const vm = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel
    >(new PlantingSpotFindByIdQuery({ id: input.id }));

    if (!vm) return null;

    if (!input.resolve) {
      return this.plantingSpotGraphQLMapper.toResponseDtoFromViewModel(vm);
    }

    const resolvedPlants = await this.plantingSpotPlantsPort.findByPlantingSpotId(vm.id);
    return this.plantingSpotGraphQLMapper.toResponseDtoFromViewModel(vm, resolvedPlants);
  }
}
