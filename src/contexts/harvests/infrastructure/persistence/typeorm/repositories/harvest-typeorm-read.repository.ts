import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  applyCriteriaToQueryBuilder,
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IHarvestReadRepository } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from '../mappers/harvest-typeorm.mapper';

const ALIAS = 'harvest';

@Injectable()
export class HarvestTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IHarvestReadRepository
{
  private readonly repository: Repository<HarvestTypeOrmEntity>;

  constructor(
    @InjectRepository(HarvestTypeOrmEntity)
    rawRepo: Repository<HarvestTypeOrmEntity>,
    private readonly mapper: HarvestTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<HarvestViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<HarvestViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder(ALIAS);
    qb.where(`${ALIAS}.space_id = :spaceId`, {
      spaceId: this.spaceContext.require(),
    });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_vm: HarvestViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
