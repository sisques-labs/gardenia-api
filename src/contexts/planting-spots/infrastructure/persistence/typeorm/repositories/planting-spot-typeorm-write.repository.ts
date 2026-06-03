import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';

@Injectable()
export class PlantingSpotTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IPlantingSpotWriteRepository
{
  private readonly repository: Repository<PlantingSpotTypeOrmEntity>;

  constructor(
    private readonly mapper: PlantingSpotTypeOrmMapper,
    @InjectRepository(PlantingSpotTypeOrmEntity)
    rawRepo: Repository<PlantingSpotTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(aggregate: PlantingSpotAggregate): Promise<PlantingSpotAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<PlantingSpotAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantingSpotAggregate>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.repository.findAndCount({
      skip,
      take: limit,
    });

    const items = entities.map((e) => this.mapper.toDomain(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
