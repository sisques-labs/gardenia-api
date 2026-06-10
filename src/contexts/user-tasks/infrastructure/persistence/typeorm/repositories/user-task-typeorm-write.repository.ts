import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { DataSource, Repository } from 'typeorm';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { IUserTaskWriteRepository } from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';
import { UserTaskTypeOrmEntity } from '../entities/user-task.entity';
import { UserTaskTypeOrmMapper } from '../mappers/user-task-typeorm.mapper';

@Injectable()
export class UserTaskTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IUserTaskWriteRepository
{
  constructor(
    private readonly mapper: UserTaskTypeOrmMapper,
    @InjectRepository(UserTaskTypeOrmEntity)
    private readonly repository: Repository<UserTaskTypeOrmEntity>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async save(aggregate: UserTaskAggregate): Promise<UserTaskAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async saveMany(tasks: UserTaskAggregate[]): Promise<void> {
    if (tasks.length === 0) return;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entities = tasks.map((t) => this.mapper.toPersistence(t));
      await queryRunner.manager.save(UserTaskTypeOrmEntity, entities);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.repository.delete({ taskTemplateId: templateId });
  }

  async findById(id: string): Promise<UserTaskAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<UserTaskAggregate>> {
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
