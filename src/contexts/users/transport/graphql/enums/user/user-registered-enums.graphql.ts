import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { UserQueryableField } from '@contexts/users/transport/graphql/enums/user/user-queryable-field.enum';
import { registerEnumType } from '@nestjs/graphql';

const registeredUserEnums = [
  {
    enum: UserStatusEnum,
    name: 'UserStatusEnum',
    description: 'The status of the user',
  },
  {
    enum: UserQueryableField,
    name: 'UserQueryableFieldEnum',
    description: 'The user fields that can be filtered/sorted on',
  },
];

for (const { enum: enumType, name, description } of registeredUserEnums) {
  registerEnumType(enumType, { name, description });
}
