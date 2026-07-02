import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IHarvestReadRepository } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from '../mappers/harvest-typeorm.mapper';

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

    const qb = this.repository.createQueryBuilder('harvest');
    qb.where('harvest.space_id = :spaceId', {
      spaceId: this.spaceContext.require(),
    });

    for (const filter of criteria.filters) {
      switch (filter.operator) {
        case FilterOperator.LIKE:
          qb.andWhere(`LOWER(harvest.${filter.field}) LIKE :${filter.field}`, {
            [filter.field]: `%${String(filter.value).toLowerCase()}%`,
          });
          break;
        case FilterOperator.EQUALS:
          qb.andWhere(`harvest.${filter.field} = :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
        case FilterOperator.NOT_EQUALS:
          qb.andWhere(`harvest.${filter.field} != :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
        case FilterOperator.IN:
          qb.andWhere(`harvest.${filter.field} IN (:...${filter.field})`, {
            [filter.field]: Array.isArray(filter.value)
              ? filter.value
              : [filter.value],
          });
          break;
        case FilterOperator.GREATER_THAN:
          qb.andWhere(`harvest.${filter.field} > :${filter.field}From`, {
            [`${filter.field}From`]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN:
          qb.andWhere(`harvest.${filter.field} < :${filter.field}To`, {
            [`${filter.field}To`]: filter.value,
          });
          break;
        case FilterOperator.GREATER_THAN_OR_EQUAL:
          qb.andWhere(`harvest.${filter.field} >= :${filter.field}From`, {
            [`${filter.field}From`]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN_OR_EQUAL:
          qb.andWhere(`harvest.${filter.field} <= :${filter.field}To`, {
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

  async save(_vm: HarvestViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
