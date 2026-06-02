import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';

import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { FindByCriteriaGraphQLDto } from '../dtos/requests/find-by-criteria-graphql.dto';
import {
  PaginatedPlantingSpotResultDto,
  PlantingSpotResponseDto,
} from '../dtos/responses/planting-spot.response.dto';
import { PlantingSpotGraphQLMapper } from '../mappers/planting-spot/planting-spot.mapper';

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

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
    @Context('req') req: { headers?: { 'x-space-id'?: string } } | string,
    @Args('input', { nullable: true }) input?: FindByCriteriaGraphQLDto,
  ): Promise<PaginatedPlantingSpotResultDto> {
    const spaceId =
      typeof req === 'string' ? req : (req?.headers?.['x-space-id'] ?? '');
    this.logger.log(
      `Finding planting spots by criteria: ${JSON.stringify(input)}`,
    );

    const result = await this.queryBus.execute<
      PlantingSpotFindByCriteriaQuery,
      PaginatedResult<PlantingSpotViewModel>
    >(
      new PlantingSpotFindByCriteriaQuery({
        spaceId,
        type: input?.type,
        page: input?.page,
        limit: input?.limit,
      }),
    );

    return this.plantingSpotGraphQLMapper.toPaginatedResponseDto(result);
  }
}
