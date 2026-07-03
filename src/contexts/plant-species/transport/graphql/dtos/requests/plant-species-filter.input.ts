import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesQueryableField } from '@contexts/plant-species/transport/graphql/enums/plant-species-queryable-field.enum';

@InputType('PlantSpeciesFilterInput')
export class PlantSpeciesFilterInput extends createFilterInput(
  PlantSpeciesQueryableField,
  'PlantSpecies',
) {}
