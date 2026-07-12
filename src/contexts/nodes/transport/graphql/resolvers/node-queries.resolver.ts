import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { NodeFindByCriteriaQuery } from '@contexts/nodes/application/queries/node-find-by-criteria/node-find-by-criteria.query';
import { NodeFindByIdQuery } from '@contexts/nodes/application/queries/node-find-by-id/node-find-by-id.query';
import { NodeTelemetryReadingFindByCriteriaQuery } from '@contexts/nodes/application/queries/node-telemetry-reading-find-by-criteria/node-telemetry-reading-find-by-criteria.query';
import { nodeFilterableFields } from '@contexts/nodes/transport/graphql/registries/node-filterable-fields.registry';
import { nodeTelemetryReadingFilterableFields } from '@contexts/nodes/transport/graphql/registries/node-telemetry-reading-filterable-fields.registry';

import { NodeFindByCriteriaRequestDto } from '../dtos/requests/node-find-by-criteria.request.dto';
import { NodeFindByIdRequestDto } from '../dtos/requests/node-find-by-id.request.dto';
import { NodeTelemetryReadingFindByCriteriaRequestDto } from '../dtos/requests/node-telemetry-reading-find-by-criteria.request.dto';
import {
  NodeResponseDto,
  PaginatedNodeResultDto,
} from '../dtos/responses/node.response.dto';
import { PaginatedNodeTelemetryReadingResultDto } from '../dtos/responses/node-telemetry-reading.response.dto';
import { NodeGraphQLMapper } from '../mappers/node.mapper';
import { NodeTelemetryReadingGraphQLMapper } from '../mappers/node-telemetry-reading.mapper';

@Resolver(() => NodeResponseDto)
@UseGuards(JwtAuthGuard)
export class NodeQueriesResolver {
  private readonly logger = new Logger(NodeQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly nodeGraphQLMapper: NodeGraphQLMapper,
    private readonly nodeTelemetryReadingGraphQLMapper: NodeTelemetryReadingGraphQLMapper,
  ) {}

  @Query(() => NodeResponseDto, { nullable: true })
  async nodeFindById(
    @Args('input') input: NodeFindByIdRequestDto,
  ): Promise<NodeResponseDto | null> {
    this.logger.log(`Finding node by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new NodeFindByIdQuery({ nodeId: input.id }),
    );

    return result
      ? this.nodeGraphQLMapper.toResponseDtoFromViewModel(result)
      : null;
  }

  @Query(() => PaginatedNodeResultDto)
  async nodesFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(nodeFilterableFields),
    )
    input?: NodeFindByCriteriaRequestDto,
  ): Promise<PaginatedNodeResultDto> {
    this.logger.log(`Finding nodes by criteria: ${JSON.stringify(input)}`);

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new NodeFindByCriteriaQuery({ criteria }),
    );

    return this.nodeGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => PaginatedNodeTelemetryReadingResultDto)
  async nodeTelemetryReadingsFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(nodeTelemetryReadingFilterableFields),
    )
    input?: NodeTelemetryReadingFindByCriteriaRequestDto,
  ): Promise<PaginatedNodeTelemetryReadingResultDto> {
    this.logger.log(
      `Finding node telemetry readings by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new NodeTelemetryReadingFindByCriteriaQuery({ criteria }),
    );

    return this.nodeTelemetryReadingGraphQLMapper.toPaginatedResponseDto(
      result,
    );
  }
}
