import { UserFilterFieldEnum } from '@contexts/users/domain/enums/user-filter-field.enum';
import { UserSortFieldEnum } from '@contexts/users/domain/enums/user-sort-field.enum';
import { createFindByCriteriaInput } from '@core/transport/graphql/criteria/create-find-by-criteria-input.factory';
import { InputType } from '@nestjs/graphql';

@InputType('UserFindByCriteriaRequestDto')
export class UserFindByCriteriaRequestDto extends createFindByCriteriaInput({
  name: 'User',
  filterFieldEnum: UserFilterFieldEnum,
  sortFieldEnum: UserSortFieldEnum,
}) {}
