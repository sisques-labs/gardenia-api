import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { IPlantReadRepository } from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';
import { PlantTypeOrmEntity } from '../entities/plant.entity';
import { PlantTypeOrmMapper } from '../mappers/plant-typeorm.mapper';

const ALIAS = 'plant';

@Injectable()
export class PlantTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantReadRepository
{
  private readonly repo: Repository<PlantTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantTypeOrmEntity)
    rawRepo: Repository<PlantTypeOrmEntity>,
    private readonly mapper: PlantTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repo = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    // createQueryBuilder bypasses createTenantRepository's find/findOne
    // proxy interception, so the space scope must be applied explicitly here.
    const qb = this.repo
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.spaceId = :spaceId`, {
        spaceId: this.spaceContext.require(),
      });

    (criteria.filters ?? []).forEach((filter, index) =>
      this.applyFilter(qb, filter, index),
    );

    this.applySort(qb, criteria);

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  private applyFilter(
    qb: SelectQueryBuilder<PlantTypeOrmEntity>,
    filter: Filter,
    index: number,
  ): void {
    const column = `${ALIAS}.${filter.field}`;
    const param = `filter${index}`;

    switch (filter.operator) {
      case FilterOperator.EQUALS:
        qb.andWhere(`${column} = :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.NOT_EQUALS:
        qb.andWhere(`${column} != :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.LIKE:
        qb.andWhere(`${column} ILIKE :${param}`, {
          [param]: `%${filter.value}%`,
        });
        break;
      case FilterOperator.IN:
        qb.andWhere(`${column} IN (:...${param})`, {
          [param]: Array.isArray(filter.value) ? filter.value : [filter.value],
        });
        break;
      case FilterOperator.GREATER_THAN:
        qb.andWhere(`${column} > :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.LESS_THAN:
        qb.andWhere(`${column} < :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.GREATER_THAN_OR_EQUAL:
        qb.andWhere(`${column} >= :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.LESS_THAN_OR_EQUAL:
        qb.andWhere(`${column} <= :${param}`, { [param]: filter.value });
        break;
    }
  }

  private applySort(
    qb: SelectQueryBuilder<PlantTypeOrmEntity>,
    criteria: Criteria,
  ): void {
    if (!criteria.sorts?.length) {
      qb.orderBy(`${ALIAS}.createdAt`, 'DESC');
      return;
    }

    criteria.sorts.forEach((sort, index) => {
      const column = `${ALIAS}.${sort.field}`;
      if (index === 0) qb.orderBy(column, sort.direction);
      else qb.addOrderBy(column, sort.direction);
    });
  }

  async save(_viewModel: PlantViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
