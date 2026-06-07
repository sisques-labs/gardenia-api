import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ITaskRunReadRepository } from '@contexts/tasks/domain/repositories/read/task-run-read.repository';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskRunTypeOrmEntity } from '../entities/task-run.entity';
import { TaskRunTypeOrmMapper } from '../mappers/task-run-typeorm.mapper';

@Injectable()
export class TaskRunTypeOrmReadRepository implements ITaskRunReadRepository {
  constructor(
    @InjectRepository(TaskRunTypeOrmEntity)
    private readonly repository: Repository<TaskRunTypeOrmEntity>,
    private readonly mapper: TaskRunTypeOrmMapper,
  ) {}

  async findByTaskId(taskId: string): Promise<TaskRunViewModel[]> {
    const entities = await this.repository.find({
      where: { taskId },
      order: { attempt: 'ASC' },
    });
    return entities.map((entity) => this.mapper.toViewModel(entity));
  }
}
