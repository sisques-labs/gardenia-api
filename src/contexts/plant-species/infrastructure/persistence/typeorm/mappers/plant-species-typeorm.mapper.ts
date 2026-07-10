import { Injectable } from '@nestjs/common';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { PlantSpeciesTypeOrmEntity } from '@contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';

@Injectable()
export class PlantSpeciesTypeOrmMapper {
  constructor(private readonly plantSpeciesBuilder: PlantSpeciesBuilder) {}

  public toDomain(entity: PlantSpeciesTypeOrmEntity): PlantSpeciesAggregate {
    return this.plantSpeciesBuilder
      .withId(entity.id)
      .withScientificName(entity.scientificName)
      .withGbifKey(entity.gbifKey ?? null)
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
    entity.scientificName = primitives.scientificName;
    entity.gbifKey = primitives.gbifKey;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }
}
