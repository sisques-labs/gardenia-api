import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { applyCriteriaToQueryBuilder } from '@sisques-labs/nestjs-kit/typeorm';
import { Repository } from 'typeorm';

import { IBridgeReadRepository } from '@contexts/nodes/domain/repositories/read/bridge-read.repository';
import { BridgeViewModel } from '@contexts/nodes/domain/view-models/bridge.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { BridgeTypeOrmEntity } from '../entities/bridge.entity';
import { BridgeTypeOrmMapper } from '../mappers/bridge-typeorm.mapper';

const ALIAS = 'bridge';

/**
 * Deliberately NOT wrapped in `createTenantRepository` — a bridge's
 * `spaceId` is nullable and must be resolvable before any space context
 * exists (bootstrap, and the pre-claim lookup in `AssertBridgeExistsService`).
 * `findByCriteria` (the only tenant-facing query — an `unclaimed` bridge
 * must never appear in it) applies the space filter manually, same as every
 * other context's `findByCriteria` already does (`createQueryBuilder`
 * bypasses the tenant proxy regardless). See design.md §5.3.
 */
@Injectable()
export class BridgeTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IBridgeReadRepository
{
  constructor(
    @InjectRepository(BridgeTypeOrmEntity)
    private readonly repo: Repository<BridgeTypeOrmEntity>,
    private readonly mapper: BridgeTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
  }

  async findById(id: string): Promise<BridgeViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<BridgeViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repo
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.spaceId = :spaceId`, {
        spaceId: this.spaceContext.require(),
      });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: BridgeViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
