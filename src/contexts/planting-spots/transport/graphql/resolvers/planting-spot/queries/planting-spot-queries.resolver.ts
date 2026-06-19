import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotFindByCriteriaRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-find-by-criteria.request.dto';
import { PlantingSpotFindByIdRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-find-by-id.request.dto';
import {
  PaginatedPlantingSpotResultDto,
  PlantingSpotResponseDto,
} from '@contexts/planting-spots/transport/graphql/dtos/responses/planting-spot.response.dto';
import { PlantingSpotGraphQLMapper } from '@contexts/planting-spots/transport/graphql/mappers/planting-spot/planting-spot.mapper';
import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';

@Resolver()
export class PlantingSpotQueriesResolver {
  private readonly logger = new Logger(PlantingSpotQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantingSpotGraphQLMapper: PlantingSpotGraphQLMapper,
  ) {}

  @Query(() => PaginatedPlantingSpotResultDto)
  async plantingSpotsFindByCriteria(
    @Args('input', { nullable: true })
    input?: PlantingSpotFindByCriteriaRequestDto,
  ): Promise<PaginatedPlantingSpotResultDto> {
    this.logger.log(
      `Finding planting spots by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new PlantingSpotFindByCriteriaQuery({
        criteria,
        resolve: input?.resolve,
      }),
    );

    return this.plantingSpotGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => PlantingSpotResponseDto, { nullable: true })
  async plantingSpotFindById(
    @Args('input') input: PlantingSpotFindByIdRequestDto,
  ): Promise<PlantingSpotResponseDto | null> {
    this.logger.log(`Finding planting spot by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new PlantingSpotFindByIdQuery({ id: input.id, resolve: input.resolve }),
    );

    return result
      ? this.plantingSpotGraphQLMapper.toResponseDtoFromViewModel(result)
      : null;
  }
}
