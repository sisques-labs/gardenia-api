import { PlantSpeciesFilterFieldEnum } from '@contexts/plant-species/domain/enums/plant-species-filter-field.enum';
import { PlantSpeciesSortFieldEnum } from '@contexts/plant-species/domain/enums/plant-species-sort-field.enum';
import { createFindByCriteriaInput } from '@core/transport/graphql/criteria/create-find-by-criteria-input.factory';
import { InputType } from '@nestjs/graphql';

@InputType('PlantSpeciesFindByCriteriaRequestDto')
export class PlantSpeciesFindByCriteriaRequestDto extends createFindByCriteriaInput(
  {
    name: 'PlantSpecies',
    filterFieldEnum: PlantSpeciesFilterFieldEnum,
    sortFieldEnum: PlantSpeciesSortFieldEnum,
  },
) {}
