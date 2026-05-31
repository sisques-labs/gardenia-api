import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

export const PLANT_SPECIES_READ_REPOSITORY = Symbol(
  'PLANT_SPECIES_READ_REPOSITORY',
);

export type IPlantSpeciesReadRepository =
  IBaseReadRepository<PlantSpeciesViewModel>;
