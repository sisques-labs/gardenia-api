import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ITaskRunReadRepository } from '@contexts/tasks/domain/repositories/read/task-run-read.repository';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskRunTypeOrmEntity } from './entities/task-run.entity';

@Injectable()
export class TaskRunTypeOrmRepository implements ITaskRunReadRepository {
  constructor(
    @InjectRepository(TaskRunTypeOrmEntity)
    private readonly repository: Repository<TaskRunTypeOrmEntity>,
  ) {}

  async create(run: Partial<TaskRunTypeOrmEntity>): Promise<TaskRunTypeOrmEntity> {
    const entity = this.repository.create(run);
    return this.repository.save(entity);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.repository.update(id, { progress });
  }

  async complete(id: string, endedAt: Date): Promise<void> {
    await this.repository.update(id, { status: 'completed', endedAt });
  }

  async fail(id: string, error: string, endedAt: Date): Promise<void> {
    await this.repository.update(id, { status: 'failed', error, endedAt });
  }

  async findByTaskId(taskId: string): Promise<TaskRunViewModel[]> {
    const entities = await this.repository.find({
      where: { taskId },
      order: { attempt: 'ASC' },
    });
    return entities.map((e) => this.toViewModel(e));
  }

  async findActiveByTaskId(taskId: string): Promise<TaskRunTypeOrmEntity | null> {
    return this.repository.findOne({ where: { taskId, status: 'active' } });
  }

  async countByTaskId(taskId: string): Promise<number> {
    return this.repository.count({ where: { taskId } });
  }

  private toViewModel(entity: TaskRunTypeOrmEntity): TaskRunViewModel {
    const vm = new TaskRunViewModel();
    vm.id = entity.id;
    vm.taskId = entity.taskId;
    vm.attempt = entity.attempt;
    vm.status = entity.status;
    vm.progress = entity.progress;
    vm.error = entity.error;
    vm.startedAt = entity.startedAt;
    vm.endedAt = entity.endedAt;
    vm.createdAt = entity.createdAt;
    return vm;
  }
}
