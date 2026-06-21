import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SensorReadingAggregate } from '@contexts/sensor-readings/domain/aggregates/sensor-reading.aggregate';
import { ISensorReadingWriteRepository } from '@contexts/sensor-readings/domain/repositories/write/sensor-reading-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';

import { SensorReadingTypeOrmEntity } from '../entities/sensor-reading.entity';
import { SensorReadingTypeOrmMapper } from '../mappers/sensor-reading-typeorm.mapper';

@Injectable()
export class SensorReadingTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ISensorReadingWriteRepository
{
  private readonly repository: Repository<SensorReadingTypeOrmEntity>;

  constructor(
    private readonly mapper: SensorReadingTypeOrmMapper,
    @InjectRepository(SensorReadingTypeOrmEntity)
    rawRepo: Repository<SensorReadingTypeOrmEntity>,
    spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(
    aggregate: SensorReadingAggregate,
  ): Promise<SensorReadingAggregate> {
    const saved = await this.repository.save(
      this.mapper.toPersistence(aggregate),
    );
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<SensorReadingAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<SensorReadingAggregate>> {
    const [entities, total] = await this.repository.findAndCount();
    return new PaginatedResult(
      entities.map((e) => this.mapper.toDomain(e)),
      total,
      1,
      20,
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
