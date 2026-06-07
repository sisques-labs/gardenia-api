import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { TaskRunAggregate } from '@contexts/tasks/domain/aggregates/task-run.aggregate';
import { TaskRunStatusEnum } from '@contexts/tasks/domain/enums/task-run-status.enum';
import { ITaskRunWriteRepository } from '@contexts/tasks/domain/repositories/write/task-run-write.repository';
import { TaskRunTypeOrmEntity } from '../entities/task-run.entity';
import { TaskRunTypeOrmMapper } from '../mappers/task-run-typeorm.mapper';

@Injectable()
export class TaskRunTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ITaskRunWriteRepository
{
  constructor(
    private readonly mapper: TaskRunTypeOrmMapper,
    @InjectRepository(TaskRunTypeOrmEntity)
    private readonly repository: Repository<TaskRunTypeOrmEntity>,
  ) {
    super();
  }

  async save(aggregate: TaskRunAggregate): Promise<TaskRunAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<TaskRunAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<TaskRunAggregate>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);
    const [entities, total] = await this.repository.findAndCount({
      skip,
      take: limit,
    });
    return new PaginatedResult(
      entities.map((entity) => this.mapper.toDomain(entity)),
      total,
      page,
      limit,
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findActiveByTaskId(taskId: string): Promise<TaskRunAggregate | null> {
    const entity = await this.repository.findOne({
      where: { taskId, status: TaskRunStatusEnum.ACTIVE },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }
}
