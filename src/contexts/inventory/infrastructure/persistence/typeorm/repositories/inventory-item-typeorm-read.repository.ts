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

import { IInventoryItemReadRepository } from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from '../mappers/inventory-item-typeorm.mapper';

const ALIAS = 'item';

@Injectable()
export class InventoryItemTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IInventoryItemReadRepository
{
  private readonly repository: Repository<InventoryItemTypeOrmEntity>;

  constructor(
    @InjectRepository(InventoryItemTypeOrmEntity)
    rawRepo: Repository<InventoryItemTypeOrmEntity>,
    private readonly mapper: InventoryItemTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<InventoryItemViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<InventoryItemViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder(ALIAS);
    qb.where(`${ALIAS}.space_id = :spaceId`, {
      spaceId: this.spaceContext.require(),
    });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
      onCustomFilter: (builder, filter) => {
        // Cross-column low-stock filter: quantity at or below a defined threshold.
        if (filter.field !== 'low_stock') return false;
        if (filter.value) {
          builder.andWhere(
            `${ALIAS}.low_stock_threshold IS NOT NULL AND ${ALIAS}.quantity <= ${ALIAS}.low_stock_threshold`,
          );
        }
        return true;
      },
    });

    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_vm: InventoryItemViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
