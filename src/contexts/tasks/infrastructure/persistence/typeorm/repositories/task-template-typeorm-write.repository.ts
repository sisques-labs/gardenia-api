import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseDatabaseRepository, Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import { ITaskTemplateWriteRepository } from '@contexts/tasks/domain/repositories/write/task-template-write.repository';
import { TaskTemplateTypeOrmEntity } from '../entities/task-template.entity';
import { TaskTemplateTypeOrmMapper } from '../mappers/task-template-typeorm.mapper';

@Injectable()
export class TaskTemplateTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ITaskTemplateWriteRepository
{
  constructor(
    private readonly mapper: TaskTemplateTypeOrmMapper,
    @InjectRepository(TaskTemplateTypeOrmEntity)
    private readonly repository: Repository<TaskTemplateTypeOrmEntity>,
  ) {
    super();
  }

  async save(aggregate: TaskTemplateAggregate): Promise<TaskTemplateAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<TaskTemplateAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(criteria: Criteria): Promise<PaginatedResult<TaskTemplateAggregate>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);
    const [entities, total] = await this.repository.findAndCount({ skip, take: limit });
    return new PaginatedResult(entities.map((e) => this.mapper.toDomain(e)), total, page, limit);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
