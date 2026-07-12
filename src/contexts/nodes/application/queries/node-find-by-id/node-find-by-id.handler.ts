import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { NodeFindByIdQuery } from '@contexts/nodes/application/queries/node-find-by-id/node-find-by-id.query';
import { AssertNodeViewModelExistsService } from '@contexts/nodes/application/services/read/assert-node-view-model-exists/assert-node-view-model-exists.service';
import { NodeViewModel } from '@contexts/nodes/domain/view-models/node.view-model';

@QueryHandler(NodeFindByIdQuery)
export class NodeFindByIdQueryHandler implements IQueryHandler<
  NodeFindByIdQuery,
  NodeViewModel
> {
  private readonly logger = new Logger(NodeFindByIdQueryHandler.name);

  constructor(
    private readonly assertNodeViewModelExistsService: AssertNodeViewModelExistsService,
  ) {}

  async execute(query: NodeFindByIdQuery): Promise<NodeViewModel> {
    this.logger.log(
      `Executing NodeFindByIdQuery for node ${query.nodeId.value}`,
    );
    return this.assertNodeViewModelExistsService.execute(query.nodeId);
  }
}
