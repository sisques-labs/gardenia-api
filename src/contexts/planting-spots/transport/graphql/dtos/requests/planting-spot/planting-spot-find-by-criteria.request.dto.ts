import { PlantingSpotFilterFieldEnum } from '@contexts/planting-spots/domain/enums/planting-spot-filter-field.enum';
import { PlantingSpotSortFieldEnum } from '@contexts/planting-spots/domain/enums/planting-spot-sort-field.enum';
import { createFindByCriteriaInput } from '@core/transport/graphql/criteria/create-find-by-criteria-input.factory';
import { InputType } from '@nestjs/graphql';

@InputType('PlantingSpotFindByCriteriaRequestDto')
export class PlantingSpotFindByCriteriaRequestDto extends createFindByCriteriaInput(
  {
    name: 'PlantingSpot',
    filterFieldEnum: PlantingSpotFilterFieldEnum,
    sortFieldEnum: PlantingSpotSortFieldEnum,
  },
) {}
