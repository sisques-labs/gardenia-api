import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseDatabaseRepository, Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { ITaskTemplateReadRepository } from '@contexts/tasks/domain/repositories/read/task-template-read.repository';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';
import { TaskTemplateTypeOrmEntity } from '../entities/task-template.entity';
import { TaskTemplateTypeOrmMapper } from '../mappers/task-template-typeorm.mapper';

@Injectable()
export class TaskTemplateTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ITaskTemplateReadRepository
{
  constructor(
    @InjectRepository(TaskTemplateTypeOrmEntity)
    private readonly repository: Repository<TaskTemplateTypeOrmEntity>,
    private readonly mapper: TaskTemplateTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<TaskTemplateViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(criteria: Criteria): Promise<PaginatedResult<TaskTemplateViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);
    const [entities, total] = await this.repository.findAndCount({ skip, take: limit });
    return new PaginatedResult(entities.map((e) => this.mapper.toViewModel(e)), total, page, limit);
  }

  async save(_vm: TaskTemplateViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
