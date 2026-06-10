import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Between, Repository } from 'typeorm';

import { IUserTaskReadRepository } from '@contexts/user-tasks/domain/repositories/read/user-task-read.repository';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';
import { UserTaskTypeOrmEntity } from '../entities/user-task.entity';
import { UserTaskTypeOrmMapper } from '../mappers/user-task-typeorm.mapper';

@Injectable()
export class UserTaskTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IUserTaskReadRepository
{
  constructor(
    @InjectRepository(UserTaskTypeOrmEntity)
    private readonly repository: Repository<UserTaskTypeOrmEntity>,
    private readonly mapper: UserTaskTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<UserTaskViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByDate(userId: string, date: Date): Promise<UserTaskViewModel[]> {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const entities = await this.repository.find({
      where: {
        userId,
        scheduledDate: Between(start, end),
      },
      order: { scheduledDate: 'ASC' },
    });
    return entities.map((e) => this.mapper.toViewModel(e));
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<UserTaskViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);
    const [entities, total] = await this.repository.findAndCount({
      skip,
      take: limit,
    });
    return new PaginatedResult(
      entities.map((e) => this.mapper.toViewModel(e)),
      total,
      page,
      limit,
    );
  }

  async save(_vm: UserTaskViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
