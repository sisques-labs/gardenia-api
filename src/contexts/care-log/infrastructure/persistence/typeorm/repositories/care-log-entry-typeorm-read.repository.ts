import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { ICareLogEntryReadRepository } from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from '../mappers/care-log-entry-typeorm.mapper';

@Injectable()
export class CareLogEntryTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ICareLogEntryReadRepository
{
  private readonly repository: Repository<CareLogEntryTypeOrmEntity>;

  constructor(
    @InjectRepository(CareLogEntryTypeOrmEntity)
    rawRepo: Repository<CareLogEntryTypeOrmEntity>,
    private readonly mapper: CareLogEntryTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<CareLogEntryViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository
      .createQueryBuilder('entry')
      .skip(skip)
      .take(limit);

    if (criteria.sorts.length > 0) {
      criteria.sorts.forEach((sort) => {
        qb.addOrderBy(`entry.${sort.field}`, sort.direction);
      });
    } else {
      qb.orderBy('entry.performedAt', 'DESC');
    }

    criteria.filters.forEach((filter, index) => {
      const param = `p${index}`;
      switch (filter.operator) {
        case FilterOperator.EQUALS:
          qb.andWhere(`entry.${filter.field} = :${param}`, {
            [param]: filter.value,
          });
          break;
        case FilterOperator.IN:
          qb.andWhere(`entry.${filter.field} IN (:...${param})`, {
            [param]: filter.value,
          });
          break;
        case FilterOperator.GREATER_THAN_OR_EQUAL:
          qb.andWhere(`entry.${filter.field} >= :${param}`, {
            [param]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN_OR_EQUAL:
          qb.andWhere(`entry.${filter.field} <= :${param}`, {
            [param]: filter.value,
          });
          break;
        case FilterOperator.GREATER_THAN:
          qb.andWhere(`entry.${filter.field} > :${param}`, {
            [param]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN:
          qb.andWhere(`entry.${filter.field} < :${param}`, {
            [param]: filter.value,
          });
          break;
      }
    });

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async findById(id: string): Promise<CareLogEntryViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findLastByType(
    plantId: string,
    activityType: string,
  ): Promise<CareLogEntryViewModel | null> {
    const entity = await this.repository.findOne({
      where: { plantId, activityType },
      order: { performedAt: 'DESC' },
    });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async save(_viewModel: CareLogEntryViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
