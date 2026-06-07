import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaskRunTypeOrmEntity } from './entities/task-run.entity';

@Injectable()
export class TaskRunTypeOrmRepository {
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

  async findByTaskId(taskId: string): Promise<TaskRunTypeOrmEntity[]> {
    return this.repository.find({
      where: { taskId },
      order: { attempt: 'ASC' },
    });
  }
}
