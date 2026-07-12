import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NodeTelemetryReadingFindByCriteriaQuery } from '@contexts/nodes/application/queries/node-telemetry-reading-find-by-criteria/node-telemetry-reading-find-by-criteria.query';
import {
  NODE_TELEMETRY_READING_READ_REPOSITORY,
  INodeTelemetryReadingReadRepository,
} from '@contexts/nodes/domain/repositories/read/node-telemetry-reading-read.repository';
import { NodeTelemetryReadingViewModel } from '@contexts/nodes/domain/view-models/node-telemetry-reading.view-model';

@QueryHandler(NodeTelemetryReadingFindByCriteriaQuery)
export class NodeTelemetryReadingFindByCriteriaQueryHandler implements IQueryHandler<NodeTelemetryReadingFindByCriteriaQuery> {
  constructor(
    @Inject(NODE_TELEMETRY_READING_READ_REPOSITORY)
    private readonly nodeTelemetryReadingReadRepository: INodeTelemetryReadingReadRepository,
  ) {}

  async execute(
    query: NodeTelemetryReadingFindByCriteriaQuery,
  ): Promise<PaginatedResult<NodeTelemetryReadingViewModel>> {
    return this.nodeTelemetryReadingReadRepository.findByCriteria(
      query.criteria,
    );
  }
}
