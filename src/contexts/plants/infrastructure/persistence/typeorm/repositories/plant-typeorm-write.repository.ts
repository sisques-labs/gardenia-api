import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';
import { PlantTypeOrmEntity } from '../entities/plant.entity';
import { PlantTypeOrmMapper } from '../mappers/plant-typeorm.mapper';

@Injectable()
export class PlantTypeOrmWriteRepository implements IPlantWriteRepository {
  private readonly repository: Repository<PlantTypeOrmEntity>;

  constructor(
    private readonly mapper: PlantTypeOrmMapper,
    @InjectRepository(PlantTypeOrmEntity)
    rawRepo: Repository<PlantTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<PlantAggregate>> {
    throw new Error('Method not implemented.');
  }

  async save(aggregate: PlantAggregate): Promise<PlantAggregate> {
    const entity = this.mapper.toEntity(aggregate);
    await this.repository.save(entity);
    return this.mapper.toAggregate(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
