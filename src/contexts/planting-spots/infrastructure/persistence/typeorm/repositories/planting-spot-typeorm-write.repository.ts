import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';

@Injectable()
export class PlantingSpotTypeOrmWriteRepository implements IPlantingSpotWriteRepository {
  private readonly repository: Repository<PlantingSpotTypeOrmEntity>;

  constructor(
    private readonly mapper: PlantingSpotTypeOrmMapper,
    @InjectRepository(PlantingSpotTypeOrmEntity)
    rawRepo: Repository<PlantingSpotTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(aggregate: PlantingSpotAggregate): Promise<void> {
    const entity = this.mapper.toPersistence(aggregate);
    await this.repository.save(entity);
  }

  async findById(
    id: string,
    spaceId: string,
  ): Promise<PlantingSpotAggregate | null> {
    const entity = await this.repository.findOne({ where: { id, spaceId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
