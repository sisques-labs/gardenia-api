import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { PlantFindByIdRequestDto } from '../../dtos/requests/plant/plant-find-by-id.request.dto';
import { PlantFindByCriteriaRequestDto } from '../../dtos/requests/plant/plant-find-by-criteria.request.dto';
import {
  PaginatedPlantResultDto,
  PlantResponseDto,
} from '../../dtos/responses/plant/plant.response.dto';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';

@Resolver(() => PlantResponseDto)
export class PlantQueriesResolver {
  private readonly logger = new Logger(PlantQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantGraphQLMapper: PlantGraphQLMapper,
  ) {}

  @Query(() => PlantResponseDto, { nullable: true })
  async plantFindById(
    @Args('input') input: PlantFindByIdRequestDto,
  ): Promise<PlantResponseDto | null> {
    this.logger.log(`Finding plant by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new PlantFindByIdQuery({ plantId: input.id }),
    );

    return result
      ? this.plantGraphQLMapper.toResponseDtoFromViewModel(result)
      : null;
  }

  @Query(() => PaginatedPlantResultDto)
  async plantsFindByCriteria(
    @Args('input', { nullable: true })
    input?: PlantFindByCriteriaRequestDto,
  ): Promise<PaginatedPlantResultDto> {
    this.logger.log(`Finding plants by criteria: ${JSON.stringify(input)}`);

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new PlantFindByCriteriaQuery({ criteria }),
    );

    return this.plantGraphQLMapper.toPaginatedResponseDto(result);
  }
}
