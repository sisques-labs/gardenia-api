import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { ICareScheduleReadRepository } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from '../mappers/care-schedule-typeorm.mapper';

@Injectable()
export class CareScheduleTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ICareScheduleReadRepository
{
  private readonly repository: Repository<CareScheduleTypeOrmEntity>;

  constructor(
    @InjectRepository(CareScheduleTypeOrmEntity)
    rawRepo: Repository<CareScheduleTypeOrmEntity>,
    private readonly mapper: CareScheduleTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<CareScheduleViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<CareScheduleViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder('schedule');
    qb.where('schedule.space_id = :spaceId', {
      spaceId: this.spaceContext.require(),
    });

    for (const filter of criteria.filters) {
      // Cross-field "due before" filter: schedules due on/before the given date.
      if (filter.field === 'due_before') {
        qb.andWhere('schedule.next_due_at <= :dueBefore', {
          dueBefore: filter.value,
        });
        continue;
      }

      switch (filter.operator) {
        case FilterOperator.LIKE:
          qb.andWhere(`LOWER(schedule.${filter.field}) LIKE :${filter.field}`, {
            [filter.field]: `%${String(filter.value).toLowerCase()}%`,
          });
          break;
        case FilterOperator.EQUALS:
          qb.andWhere(`schedule.${filter.field} = :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
        case FilterOperator.NOT_EQUALS:
          qb.andWhere(`schedule.${filter.field} != :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
        case FilterOperator.IN:
          qb.andWhere(`schedule.${filter.field} IN (:...${filter.field})`, {
            [filter.field]: Array.isArray(filter.value)
              ? filter.value
              : [filter.value],
          });
          break;
        case FilterOperator.GREATER_THAN:
          qb.andWhere(`schedule.${filter.field} > :${filter.field}From`, {
            [`${filter.field}From`]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN:
          qb.andWhere(`schedule.${filter.field} < :${filter.field}To`, {
            [`${filter.field}To`]: filter.value,
          });
          break;
        case FilterOperator.GREATER_THAN_OR_EQUAL:
          qb.andWhere(`schedule.${filter.field} >= :${filter.field}From`, {
            [`${filter.field}From`]: filter.value,
          });
          break;
        case FilterOperator.LESS_THAN_OR_EQUAL:
          qb.andWhere(`schedule.${filter.field} <= :${filter.field}To`, {
            [`${filter.field}To`]: filter.value,
          });
          break;
      }
    }

    qb.orderBy('schedule.next_due_at', 'ASC');
    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_vm: CareScheduleViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
