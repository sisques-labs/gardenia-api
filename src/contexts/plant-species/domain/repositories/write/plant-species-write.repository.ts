import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesAggregate } from '../../aggregates/plant-species.aggregate';

export const PLANT_SPECIES_WRITE_REPOSITORY = Symbol(
  'PLANT_SPECIES_WRITE_REPOSITORY',
);

export interface IPlantSpeciesWriteRepository extends IBaseWriteRepository<PlantSpeciesAggregate> {
  findByNameNormalized(
    normalizedName: string,
  ): Promise<PlantSpeciesAggregate | null>;
}
