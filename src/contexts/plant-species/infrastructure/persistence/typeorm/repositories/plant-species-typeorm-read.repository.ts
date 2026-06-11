import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IPlantSpeciesReadRepository } from '@contexts/plant-species/domain/repositories/read/plant-species-read.repository';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesTypeOrmEntity } from '@contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from '@contexts/plant-species/infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper';

@Injectable()
export class PlantSpeciesTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantSpeciesReadRepository
{
  constructor(
    @InjectRepository(PlantSpeciesTypeOrmEntity)
    private readonly plantSpeciesRepo: Repository<PlantSpeciesTypeOrmEntity>,
    private readonly plantSpeciesMapper: PlantSpeciesTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<PlantSpeciesViewModel | null> {
    const entity = await this.plantSpeciesRepo.findOne({ where: { id } });
    if (!entity) return null;

    const aggregate = this.plantSpeciesMapper.toDomain(entity);
    return new PlantSpeciesViewModel(aggregate.toPrimitives());
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantSpeciesViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.plantSpeciesRepo.findAndCount({
      skip,
      take: limit,
      order: criteria.sorts?.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        { scientificName: 'ASC' },
      ),
    });

    const items = entities.map((entity) => {
      const aggregate = this.plantSpeciesMapper.toDomain(entity);
      return new PlantSpeciesViewModel(aggregate.toPrimitives());
    });

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: PlantSpeciesViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
