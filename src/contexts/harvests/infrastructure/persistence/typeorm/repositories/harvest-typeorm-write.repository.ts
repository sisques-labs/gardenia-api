import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { IHarvestWriteRepository } from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from '../mappers/harvest-typeorm.mapper';

@Injectable()
export class HarvestTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IHarvestWriteRepository
{
  private readonly repository: Repository<HarvestTypeOrmEntity>;

  constructor(
    private readonly mapper: HarvestTypeOrmMapper,
    @InjectRepository(HarvestTypeOrmEntity)
    rawRepo: Repository<HarvestTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(aggregate: HarvestAggregate): Promise<HarvestAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<HarvestAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<HarvestAggregate>> {
    const [entities, total] = await this.repository.findAndCount();
    const items = entities.map((e) => this.mapper.toDomain(e));
    return new PaginatedResult(items, total, 1, 20);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
