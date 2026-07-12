import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NodeFindByCriteriaQuery } from '@contexts/nodes/application/queries/node-find-by-criteria/node-find-by-criteria.query';
import {
  NODE_READ_REPOSITORY,
  INodeReadRepository,
} from '@contexts/nodes/domain/repositories/read/node-read.repository';
import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';

@QueryHandler(NodeFindByCriteriaQuery)
export class NodeFindByCriteriaQueryHandler implements IQueryHandler<NodeFindByCriteriaQuery> {
  constructor(
    @Inject(NODE_READ_REPOSITORY)
    private readonly nodeReadRepository: INodeReadRepository,
  ) {}

  async execute(
    query: NodeFindByCriteriaQuery,
  ): Promise<PaginatedResult<NodeViewModel>> {
    return this.nodeReadRepository.findByCriteria(query.criteria);
  }
}
