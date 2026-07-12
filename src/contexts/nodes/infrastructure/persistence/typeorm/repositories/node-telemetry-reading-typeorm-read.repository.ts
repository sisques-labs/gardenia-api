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

import { INodeTelemetryReadingReadRepository } from '@contexts/nodes/domain/repositories/read/node-telemetry-reading-read.repository';
import { NodeTelemetryReadingViewModel } from '@contexts/nodes/domain/view-models/node-telemetry-reading.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { NodeTelemetryReadingTypeOrmEntity } from '../entities/node-telemetry-reading.entity';
import { NodeTelemetryReadingTypeOrmMapper } from '../mappers/node-telemetry-reading-typeorm.mapper';

const ALIAS = 'reading';

@Injectable()
export class NodeTelemetryReadingTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements INodeTelemetryReadingReadRepository
{
  private readonly repo: Repository<NodeTelemetryReadingTypeOrmEntity>;

  constructor(
    @InjectRepository(NodeTelemetryReadingTypeOrmEntity)
    rawRepo: Repository<NodeTelemetryReadingTypeOrmEntity>,
    private readonly mapper: NodeTelemetryReadingTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repo = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<NodeTelemetryReadingViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<NodeTelemetryReadingViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repo
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.spaceId = :spaceId`, {
        spaceId: this.spaceContext.require(),
      });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'recordedAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: NodeTelemetryReadingViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
