import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { ICareScheduleWriteRepository } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from '../mappers/care-schedule-typeorm.mapper';

@Injectable()
export class CareScheduleTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ICareScheduleWriteRepository
{
  private readonly repository: Repository<CareScheduleTypeOrmEntity>;

  constructor(
    private readonly mapper: CareScheduleTypeOrmMapper,
    @InjectRepository(CareScheduleTypeOrmEntity)
    rawRepo: Repository<CareScheduleTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(aggregate: CareScheduleAggregate): Promise<CareScheduleAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<CareScheduleAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<CareScheduleAggregate>> {
    const [entities, total] = await this.repository.findAndCount();
    const items = entities.map((e) => this.mapper.toDomain(e));
    return new PaginatedResult(items, total, 1, 20);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
