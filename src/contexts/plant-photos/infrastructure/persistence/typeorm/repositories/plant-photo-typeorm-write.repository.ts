import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { IPlantPhotoWriteRepository } from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantPhotoTypeOrmEntity } from '../entities/plant-photo.entity';
import { PlantPhotoTypeOrmMapper } from '../mappers/plant-photo-typeorm.mapper';

@Injectable()
export class PlantPhotoTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IPlantPhotoWriteRepository
{
  private readonly repository: Repository<PlantPhotoTypeOrmEntity>;

  constructor(
    private readonly mapper: PlantPhotoTypeOrmMapper,
    @InjectRepository(PlantPhotoTypeOrmEntity)
    rawRepo: Repository<PlantPhotoTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(aggregate: PlantPhotoAggregate): Promise<PlantPhotoAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<PlantPhotoAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<PlantPhotoAggregate>> {
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
