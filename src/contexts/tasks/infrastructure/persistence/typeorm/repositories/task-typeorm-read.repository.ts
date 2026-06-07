import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseDatabaseRepository, Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { ITaskReadRepository } from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import { TaskTypeOrmEntity } from '../entities/task.entity';
import { TaskTypeOrmMapper } from '../mappers/task-typeorm.mapper';

@Injectable()
export class TaskTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ITaskReadRepository
{
  constructor(
    @InjectRepository(TaskTypeOrmEntity)
    private readonly repository: Repository<TaskTypeOrmEntity>,
    private readonly mapper: TaskTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<TaskViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<TaskViewModel | null> {
    const entity = await this.repository.findOne({ where: { id, userId } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByIdempotencyKey(
    key: string,
    activeStatuses: string[],
  ): Promise<TaskViewModel | null> {
    const entity = await this.repository
      .createQueryBuilder('task')
      .where('task.idempotency_key = :key', { key })
      .andWhere('task.status IN (:...statuses)', { statuses: activeStatuses })
      .getOne();
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(criteria: Criteria): Promise<PaginatedResult<TaskViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder('task');

    if (criteria.filters) {
      for (const filter of criteria.filters) {
        if (filter.field === 'userId') {
          qb.andWhere('task.user_id = :userId', { userId: filter.value });
        } else if (filter.field === 'status') {
          qb.andWhere('task.status = :status', { status: filter.value });
        } else if (filter.field === 'templateId') {
          qb.andWhere('task.task_template_id = :templateId', { templateId: filter.value });
        }
      }
    }

    qb.skip(skip).take(limit);
    const [entities, total] = await qb.getManyAndCount();
    return new PaginatedResult(entities.map((e) => this.mapper.toViewModel(e)), total, page, limit);
  }

  async save(_vm: TaskViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
