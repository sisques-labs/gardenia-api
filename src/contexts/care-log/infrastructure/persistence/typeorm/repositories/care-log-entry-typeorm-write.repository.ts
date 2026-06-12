import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { ICareLogEntryWriteRepository } from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from '../mappers/care-log-entry-typeorm.mapper';

@Injectable()
export class CareLogEntryTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ICareLogEntryWriteRepository
{
  private readonly repository: Repository<CareLogEntryTypeOrmEntity>;

  constructor(
    private readonly mapper: CareLogEntryTypeOrmMapper,
    @InjectRepository(CareLogEntryTypeOrmEntity)
    rawRepo: Repository<CareLogEntryTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<CareLogEntryAggregate>> {
    throw new Error('Method not implemented.');
  }

  async save(aggregate: CareLogEntryAggregate): Promise<CareLogEntryAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<CareLogEntryAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
