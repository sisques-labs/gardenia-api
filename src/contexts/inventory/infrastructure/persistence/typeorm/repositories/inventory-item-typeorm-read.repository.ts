import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IInventoryItemReadRepository } from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from '../mappers/inventory-item-typeorm.mapper';

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

    const qb = this.repository.createQueryBuilder('item');
    qb.where('item.space_id = :spaceId', {
      spaceId: this.spaceContext.require(),
    });

    for (const filter of criteria.filters) {
      // Cross-column low-stock filter: quantity at or below a defined threshold.
      if (filter.field === 'low_stock') {
        if (filter.value) {
          qb.andWhere(
            'item.low_stock_threshold IS NOT NULL AND item.quantity <= item.low_stock_threshold',
          );
        }
        continue;
      }

      switch (filter.operator) {
        case FilterOperator.LIKE:
          qb.andWhere(`LOWER(item.${filter.field}) LIKE :${filter.field}`, {
            [filter.field]: `%${String(filter.value).toLowerCase()}%`,
          });
          break;
        case FilterOperator.EQUALS:
          qb.andWhere(`item.${filter.field} = :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
        case FilterOperator.NOT_EQUALS:
          qb.andWhere(`item.${filter.field} != :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
        case FilterOperator.IN:
          qb.andWhere(`item.${filter.field} IN (:...${filter.field})`, {
            [filter.field]: Array.isArray(filter.value)
              ? filter.value
              : [filter.value],
          });
          break;
        case FilterOperator.GREATER_THAN:
          qb.andWhere(`item.${filter.field} > :${filter.field}From`, {
            [`${filter.field}From`]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN:
          qb.andWhere(`item.${filter.field} < :${filter.field}To`, {
            [`${filter.field}To`]: filter.value,
          });
          break;
        case FilterOperator.GREATER_THAN_OR_EQUAL:
          qb.andWhere(`item.${filter.field} >= :${filter.field}From`, {
            [`${filter.field}From`]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN_OR_EQUAL:
          qb.andWhere(`item.${filter.field} <= :${filter.field}To`, {
            [`${filter.field}To`]: filter.value,
          });
          break;
      }
    }

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
