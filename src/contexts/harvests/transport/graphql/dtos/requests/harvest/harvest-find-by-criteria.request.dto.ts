import { HarvestFilterFieldEnum } from '@contexts/harvests/domain/enums/harvest-filter-field.enum';
import { HarvestSortFieldEnum } from '@contexts/harvests/domain/enums/harvest-sort-field.enum';
import { createFindByCriteriaInput } from '@core/transport/graphql/criteria/create-find-by-criteria-input.factory';
import { InputType } from '@nestjs/graphql';

@InputType('HarvestFindByCriteriaRequestDto')
export class HarvestFindByCriteriaRequestDto extends createFindByCriteriaInput({
  name: 'Harvest',
  filterFieldEnum: HarvestFilterFieldEnum,
  sortFieldEnum: HarvestSortFieldEnum,
}) {}
