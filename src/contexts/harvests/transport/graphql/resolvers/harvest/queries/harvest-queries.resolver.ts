import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { HarvestFindByIdQuery } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query';
import { harvestFilterableFields } from '@contexts/harvests/transport/graphql/registries/harvest-filterable-fields.registry';
import { HarvestFindByCriteriaRequestDto } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-find-by-criteria.request.dto';
import { HarvestFindByIdRequestDto } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-find-by-id.request.dto';
import {
  HarvestResponseDto,
  PaginatedHarvestResultDto,
} from '@contexts/harvests/transport/graphql/dtos/responses/harvest.response.dto';
import { HarvestGraphQLMapper } from '@contexts/harvests/transport/graphql/mappers/harvest/harvest.mapper';

@Resolver()
export class HarvestQueriesResolver {
  private readonly logger = new Logger(HarvestQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly harvestGraphQLMapper: HarvestGraphQLMapper,
  ) {}

  @Query(() => PaginatedHarvestResultDto)
  async harvestsFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(harvestFilterableFields),
    )
    input?: HarvestFindByCriteriaRequestDto,
  ): Promise<PaginatedHarvestResultDto> {
    this.logger.log(`Finding harvests by criteria: ${JSON.stringify(input)}`);

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new HarvestFindByCriteriaQuery(criteria),
    );

    return this.harvestGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => HarvestResponseDto, { nullable: true })
  async harvestFindById(
    @Args('input') input: HarvestFindByIdRequestDto,
  ): Promise<HarvestResponseDto | null> {
    this.logger.log(`Finding harvest by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new HarvestFindByIdQuery({ id: input.id }),
    );

    return result ? this.harvestGraphQLMapper.toResponseDto(result) : null;
  }
}
