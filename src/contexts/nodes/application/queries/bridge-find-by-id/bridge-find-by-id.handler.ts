import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { BridgeFindByIdQuery } from '@contexts/nodes/application/queries/bridge-find-by-id/bridge-find-by-id.query';
import { AssertBridgeViewModelExistsService } from '@contexts/nodes/application/services/read/assert-bridge-view-model-exists/assert-bridge-view-model-exists.service';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';

@QueryHandler(BridgeFindByIdQuery)
export class BridgeFindByIdQueryHandler implements IQueryHandler<
  BridgeFindByIdQuery,
  BridgeViewModel
> {
  private readonly logger = new Logger(BridgeFindByIdQueryHandler.name);

  constructor(
    private readonly assertBridgeViewModelExistsService: AssertBridgeViewModelExistsService,
  ) {}

  async execute(query: BridgeFindByIdQuery): Promise<BridgeViewModel> {
    this.logger.log(
      `Executing BridgeFindByIdQuery for bridge ${query.bridgeId.value}`,
    );
    return this.assertBridgeViewModelExistsService.execute(query.bridgeId);
  }
}
