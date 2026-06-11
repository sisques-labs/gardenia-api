import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesTypeOrmEntity } from '@contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from '@contexts/plant-species/infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper';

@Injectable()
export class PlantSpeciesTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IPlantSpeciesWriteRepository
{
  constructor(
    @InjectRepository(PlantSpeciesTypeOrmEntity)
    private readonly plantSpeciesRepo: Repository<PlantSpeciesTypeOrmEntity>,
    private readonly plantSpeciesMapper: PlantSpeciesTypeOrmMapper,
  ) {
    super();
  }

  async save(
    plantSpecies: PlantSpeciesAggregate,
  ): Promise<PlantSpeciesAggregate> {
    const entity = this.plantSpeciesMapper.toPersistence(
      plantSpecies,
    ) as PlantSpeciesTypeOrmEntity;
    const savedEntity = await this.plantSpeciesRepo.save(entity);
    return this.plantSpeciesMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<PlantSpeciesAggregate | null> {
    const entity = await this.plantSpeciesRepo.findOne({ where: { id } });
    return entity ? this.plantSpeciesMapper.toDomain(entity) : null;
  }

  async findByScientificName(
    normalizedScientificName: string,
  ): Promise<PlantSpeciesAggregate | null> {
    const entity = await this.plantSpeciesRepo
      .createQueryBuilder('ps')
      .where('LOWER(TRIM(ps.scientific_name)) = :normalizedScientificName', {
        normalizedScientificName,
      })
      .getOne();

    return entity ? this.plantSpeciesMapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantSpeciesAggregate>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.plantSpeciesRepo.findAndCount({
      skip,
      take: limit,
      order: criteria.sorts?.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        { scientificName: 'ASC' },
      ),
    });

    const items = entities.map((entity) =>
      this.plantSpeciesMapper.toDomain(entity),
    );

    return new PaginatedResult(items, total, page, limit);
  }

  async delete(id: string): Promise<void> {
    await this.plantSpeciesRepo.delete(id);
  }
}
