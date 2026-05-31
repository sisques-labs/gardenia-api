import { Injectable } from '@nestjs/common';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { PlantSpeciesTypeOrmEntity } from '../entities/plant-species.entity';

@Injectable()
export class PlantSpeciesTypeOrmMapper {
  constructor(private readonly plantSpeciesBuilder: PlantSpeciesBuilder) {}

  public toDomain(entity: PlantSpeciesTypeOrmEntity): PlantSpeciesAggregate {
    return this.plantSpeciesBuilder
      .withId(entity.id)
      .withName(entity.name)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    plantSpecies: PlantSpeciesAggregate,
  ): Partial<PlantSpeciesTypeOrmEntity> {
    const primitives = plantSpecies.toPrimitives();
    const entity = new PlantSpeciesTypeOrmEntity();

    entity.id = primitives.id;
    entity.name = primitives.name;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }
}
