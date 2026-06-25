import { UserFilterFieldEnum } from '@contexts/users/domain/enums/user-filter-field.enum';
import { UserSortFieldEnum } from '@contexts/users/domain/enums/user-sort-field.enum';
import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { registerEnumType } from '@nestjs/graphql';

const registeredUserEnums = [
  {
    enum: UserStatusEnum,
    name: 'UserStatusEnum',
    description: 'The status of the user',
  },
  {
    enum: UserFilterFieldEnum,
    name: 'UserFilterFieldEnum',
    description: 'The user fields that can be filtered by',
  },
  {
    enum: UserSortFieldEnum,
    name: 'UserSortFieldEnum',
    description: 'The user fields that can be sorted by',
  },
];

for (const { enum: enumType, name, description } of registeredUserEnums) {
  registerEnumType(enumType, { name, description });
}
