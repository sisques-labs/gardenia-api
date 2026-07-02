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

import { IPlantSpeciesReadRepository } from '@contexts/plant-species/domain/repositories/read/plant-species-read.repository';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesTypeOrmEntity } from '@contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from '@contexts/plant-species/infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper';

const ALIAS = 'species';

@Injectable()
export class PlantSpeciesTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantSpeciesReadRepository
{
  constructor(
    @InjectRepository(PlantSpeciesTypeOrmEntity)
    private readonly plantSpeciesRepo: Repository<PlantSpeciesTypeOrmEntity>,
    private readonly plantSpeciesMapper: PlantSpeciesTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<PlantSpeciesViewModel | null> {
    const entity = await this.plantSpeciesRepo.findOne({ where: { id } });
    if (!entity) return null;

    const aggregate = this.plantSpeciesMapper.toDomain(entity);
    return new PlantSpeciesViewModel(aggregate.toPrimitives());
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantSpeciesViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.plantSpeciesRepo.createQueryBuilder(ALIAS);

    (criteria.filters ?? []).forEach((filter, index) =>
      this.applyFilter(qb, filter, index),
    );

    this.applySort(qb, criteria);

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((entity) => {
      const aggregate = this.plantSpeciesMapper.toDomain(entity);
      return new PlantSpeciesViewModel(aggregate.toPrimitives());
    });

    return new PaginatedResult(items, total, page, limit);
  }

  private applyFilter(
    qb: SelectQueryBuilder<PlantSpeciesTypeOrmEntity>,
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
    qb: SelectQueryBuilder<PlantSpeciesTypeOrmEntity>,
    criteria: Criteria,
  ): void {
    if (!criteria.sorts?.length) {
      qb.orderBy(`${ALIAS}.scientificName`, 'ASC');
      return;
    }

    criteria.sorts.forEach((sort, index) => {
      const column = `${ALIAS}.${sort.field}`;
      if (index === 0) qb.orderBy(column, sort.direction);
      else qb.addOrderBy(column, sort.direction);
    });
  }

  async save(_viewModel: PlantSpeciesViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
