import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IPlantingSpotReadRepository } from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';

@Injectable()
export class PlantingSpotTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantingSpotReadRepository
{
  private readonly repository: Repository<PlantingSpotTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantingSpotTypeOrmEntity)
    rawRepo: Repository<PlantingSpotTypeOrmEntity>,
    private readonly mapper: PlantingSpotTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantingSpotViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantingSpotViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.repository.findAndCount({
      skip,
      take: limit,
    });

    return new PaginatedResult(
      entities.map((e) => this.toViewModel(e)),
      total,
      page,
      limit,
    );
  }

  async save(_viewModel: PlantingSpotViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toViewModel(
    entity: PlantingSpotTypeOrmEntity,
  ): PlantingSpotViewModel {
    const aggregate = this.mapper.toDomain(entity);
    return new PlantingSpotViewModel(aggregate.toPrimitives());
  }
}
