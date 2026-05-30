import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IPlantReadRepository } from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';
import { PlantTypeOrmEntity } from '../entities/plant.entity';
import { PlantTypeOrmMapper } from '../mappers/plant-typeorm.mapper';

@Injectable()
export class PlantTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantReadRepository
{
  private readonly repo: Repository<PlantTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantTypeOrmEntity)
    rawRepo: Repository<PlantTypeOrmEntity>,
    private readonly mapper: PlantTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repo = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: criteria.sorts.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: PlantViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
