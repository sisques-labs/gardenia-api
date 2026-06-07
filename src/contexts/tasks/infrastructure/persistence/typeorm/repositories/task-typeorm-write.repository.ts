import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskTypeOrmEntity } from '../entities/task.entity';
import { TaskTypeOrmMapper } from '../mappers/task-typeorm.mapper';

@Injectable()
export class TaskTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ITaskWriteRepository
{
  constructor(
    private readonly mapper: TaskTypeOrmMapper,
    @InjectRepository(TaskTypeOrmEntity)
    private readonly repository: Repository<TaskTypeOrmEntity>,
  ) {
    super();
  }

  async save(aggregate: TaskAggregate): Promise<TaskAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<TaskAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<TaskAggregate>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);
    const [entities, total] = await this.repository.findAndCount({
      skip,
      take: limit,
    });
    return new PaginatedResult(
      entities.map((e) => this.mapper.toDomain(e)),
      total,
      page,
      limit,
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
