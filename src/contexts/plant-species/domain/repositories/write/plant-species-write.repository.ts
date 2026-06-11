import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';

export const PLANT_SPECIES_WRITE_REPOSITORY = Symbol(
  'PLANT_SPECIES_WRITE_REPOSITORY',
);

export interface IPlantSpeciesWriteRepository extends IBaseWriteRepository<PlantSpeciesAggregate> {
  findByScientificName(
    normalizedScientificName: string,
  ): Promise<PlantSpeciesAggregate | null>;
}
