import { PlantFilterFieldEnum } from '@contexts/plants/domain/enums/plant-filter-field.enum';
import { PlantSortFieldEnum } from '@contexts/plants/domain/enums/plant-sort-field.enum';
import { createFindByCriteriaInput } from '@core/transport/graphql/criteria/create-find-by-criteria-input.factory';
import { InputType } from '@nestjs/graphql';

@InputType('PlantFindByCriteriaRequestDto')
export class PlantFindByCriteriaRequestDto extends createFindByCriteriaInput({
  name: 'Plant',
  filterFieldEnum: PlantFilterFieldEnum,
  sortFieldEnum: PlantSortFieldEnum,
}) {}
