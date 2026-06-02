import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import {
  IPlantingSpotReadRepository,
  PlantingSpotCriteria,
} from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';

@Injectable()
export class PlantingSpotTypeOrmReadRepository implements IPlantingSpotReadRepository {
  private readonly repository: Repository<PlantingSpotTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantingSpotTypeOrmEntity)
    rawRepo: Repository<PlantingSpotTypeOrmEntity>,
    private readonly mapper: PlantingSpotTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(
    id: string,
    spaceId: string,
  ): Promise<PlantingSpotViewModel | null> {
    const entity = await this.repository.findOne({ where: { id, spaceId } });
    return entity ? this.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: PlantingSpotCriteria,
  ): Promise<PlantingSpotViewModel[]> {
    const where: FindOptionsWhere<PlantingSpotTypeOrmEntity> = {
      spaceId: criteria.spaceId,
    };

    if (criteria.type !== undefined) {
      where.type = criteria.type;
    }

    const page = criteria.page ?? 1;
    const limit = Math.min(criteria.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const entities = await this.repository.find({
      where,
      skip,
      take: limit,
    });

    return entities.map((e) => this.toViewModel(e));
  }

  private toViewModel(
    entity: PlantingSpotTypeOrmEntity,
  ): PlantingSpotViewModel {
    const aggregate = this.mapper.toDomain(entity);
    return new PlantingSpotViewModel(aggregate.toPrimitives());
  }
}
