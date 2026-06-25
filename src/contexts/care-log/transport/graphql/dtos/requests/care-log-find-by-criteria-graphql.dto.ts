import { CareLogFilterFieldEnum } from '@contexts/care-log/domain/enums/care-log-filter-field.enum';
import { CareLogSortFieldEnum } from '@contexts/care-log/domain/enums/care-log-sort-field.enum';
import { createFindByCriteriaInput } from '@core/transport/graphql/criteria/create-find-by-criteria-input.factory';
import { InputType } from '@nestjs/graphql';

@InputType('CareLogFindByCriteriaRequestDto')
export class CareLogFindByCriteriaRequestDto extends createFindByCriteriaInput({
  name: 'CareLog',
  filterFieldEnum: CareLogFilterFieldEnum,
  sortFieldEnum: CareLogSortFieldEnum,
}) {}
