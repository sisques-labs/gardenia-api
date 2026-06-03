import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { FindByCriteriaGraphQLDto } from '../dtos/requests/find-by-criteria-graphql.dto';
import {
  PaginatedPlantingSpotResultDto,
  PlantingSpotResponseDto,
} from '../dtos/responses/planting-spot.response.dto';
import { PlantingSpotGraphQLMapper } from '../mappers/planting-spot/planting-spot.mapper';

@Resolver()
export class PlantingSpotQueriesResolver {
  private readonly logger = new Logger(PlantingSpotQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantingSpotGraphQLMapper: PlantingSpotGraphQLMapper,
  ) {}

  @Query(() => PlantingSpotResponseDto, { nullable: true })
  async plantingSpot(
    @Args('id') id: string,
    @Context('req') req: { headers?: { 'x-space-id'?: string } } | string,
  ): Promise<PlantingSpotResponseDto | null> {
    const spaceId =
      typeof req === 'string' ? req : (req?.headers?.['x-space-id'] ?? '');
    this.logger.log(`Finding planting spot by id: ${id}`);

    const result = await this.queryBus.execute<
      PlantingSpotFindByIdQuery,
      PlantingSpotViewModel | null
    >(new PlantingSpotFindByIdQuery({ spotId: id, spaceId }));

    return result ? this.plantingSpotGraphQLMapper.toResponseDto(result) : null;
  }

  @Query(() => PaginatedPlantingSpotResultDto)
  async plantingSpots(
    @Args('input', { nullable: true }) input?: FindByCriteriaGraphQLDto,
  ): Promise<PaginatedPlantingSpotResultDto> {
    this.logger.log(
      `Finding planting spots by criteria: ${JSON.stringify(input)}`,
    );

    const result = await this.queryBus.execute<
      PlantingSpotFindByCriteriaQuery,
      PaginatedResult<PlantingSpotViewModel>
    >(
      new PlantingSpotFindByCriteriaQuery({
        criteria: new Criteria(
          input?.type
            ? [
                {
                  field: 'type',
                  operator: FilterOperator.EQUALS,
                  value: input.type,
                },
              ]
            : undefined,
          undefined,
          input?.page || input?.limit
            ? { page: input.page ?? 1, perPage: input.limit ?? 20 }
            : undefined,
        ),
      }),
    );

    return this.plantingSpotGraphQLMapper.toPaginatedResponseDto(result);
  }
}
