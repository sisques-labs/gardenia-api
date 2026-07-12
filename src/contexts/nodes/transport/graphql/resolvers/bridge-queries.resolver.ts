import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { BridgeFindByCriteriaQuery } from '@contexts/nodes/application/queries/bridge-find-by-criteria/bridge-find-by-criteria.query';
import { BridgeFindByIdQuery } from '@contexts/nodes/application/queries/bridge-find-by-id/bridge-find-by-id.query';
import { bridgeFilterableFields } from '@contexts/nodes/transport/graphql/registries/bridge-filterable-fields.registry';

import { BridgeFindByCriteriaRequestDto } from '../dtos/requests/bridge-find-by-criteria.request.dto';
import { BridgeFindByIdRequestDto } from '../dtos/requests/bridge-find-by-id.request.dto';
import {
  BridgeResponseDto,
  PaginatedBridgeResultDto,
} from '../dtos/responses/bridge.response.dto';
import { BridgeGraphQLMapper } from '../mappers/bridge.mapper';

@Resolver(() => BridgeResponseDto)
@UseGuards(JwtAuthGuard)
export class BridgeQueriesResolver {
  private readonly logger = new Logger(BridgeQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly bridgeGraphQLMapper: BridgeGraphQLMapper,
  ) {}

  @Query(() => BridgeResponseDto, { nullable: true })
  async bridgeFindById(
    @Args('input') input: BridgeFindByIdRequestDto,
  ): Promise<BridgeResponseDto | null> {
    this.logger.log(`Finding bridge by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new BridgeFindByIdQuery({ bridgeId: input.id }),
    );

    return result
      ? this.bridgeGraphQLMapper.toResponseDtoFromViewModel(result)
      : null;
  }

  @Query(() => PaginatedBridgeResultDto)
  async bridgesFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(bridgeFilterableFields),
    )
    input?: BridgeFindByCriteriaRequestDto,
  ): Promise<PaginatedBridgeResultDto> {
    this.logger.log(`Finding bridges by criteria: ${JSON.stringify(input)}`);

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new BridgeFindByCriteriaQuery({ criteria }),
    );

    return this.bridgeGraphQLMapper.toPaginatedResponseDto(result);
  }
}
