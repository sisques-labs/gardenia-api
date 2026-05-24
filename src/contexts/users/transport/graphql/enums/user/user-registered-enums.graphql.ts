import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { registerEnumType } from '@nestjs/graphql';

const registeredUserEnums = [
  {
    enum: UserStatusEnum,
    name: 'UserStatusEnum',
    description: 'The status of the user',
  },
];

for (const { enum: enumType, name, description } of registeredUserEnums) {
  registerEnumType(enumType, { name, description });
}
