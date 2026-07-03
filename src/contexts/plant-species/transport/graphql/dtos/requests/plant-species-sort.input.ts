import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesQueryableField } from '@contexts/plant-species/transport/graphql/enums/plant-species-queryable-field.enum';

@InputType('PlantSpeciesSortInput')
export class PlantSpeciesSortInput extends createSortInput(
  PlantSpeciesQueryableField,
  'PlantSpecies',
) {}
