import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { BridgeFindByCriteriaQuery } from '@contexts/nodes/application/queries/bridge-find-by-criteria/bridge-find-by-criteria.query';
import {
  BRIDGE_READ_REPOSITORY,
  IBridgeReadRepository,
} from '@contexts/nodes/domain/repositories/read/bridge-read.repository';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';

@QueryHandler(BridgeFindByCriteriaQuery)
export class BridgeFindByCriteriaQueryHandler implements IQueryHandler<BridgeFindByCriteriaQuery> {
  constructor(
    @Inject(BRIDGE_READ_REPOSITORY)
    private readonly bridgeReadRepository: IBridgeReadRepository,
  ) {}

  async execute(
    query: BridgeFindByCriteriaQuery,
  ): Promise<PaginatedResult<BridgeViewModel>> {
    // Tenant scoping for bridges is applied inside the repository's
    // findByCriteria QueryBuilder (bridges aren't wrapped in
    // createTenantRepository — see BridgeTypeOrmReadRepository).
    return this.bridgeReadRepository.findByCriteria(query.criteria);
  }
}
