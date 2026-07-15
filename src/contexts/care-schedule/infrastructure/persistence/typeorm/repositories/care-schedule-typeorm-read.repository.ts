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

import { ICareScheduleReadRepository } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from '../mappers/care-schedule-typeorm.mapper';

const ALIAS = 'schedule';

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

    const qb = this.repository.createQueryBuilder(ALIAS);
    qb.where(`${ALIAS}.space_id = :spaceId`, {
      spaceId: this.spaceContext.require(),
    });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'nextDueAt', direction: SortDirection.ASC },
      onCustomFilter: (builder, filter) => {
        // Cross-field "due before" filter: schedules due on/before the given date.
        if (filter.field !== 'due_before') return false;
        builder.andWhere(`${ALIAS}.next_due_at <= :dueBefore`, {
          dueBefore: filter.value,
        });
        return true;
      },
    });

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
