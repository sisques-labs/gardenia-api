import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit';

import { UserQueryableField } from '@contexts/users/transport/graphql/enums/user/user-queryable-field.enum';

/**
 * `field` is typed to {@link UserQueryableField} instead of a free string.
 * `createSortInput` registers its returned class `{ isAbstract: true }`, so
 * this subclass needs its own `@InputType` to actually register a concrete
 * GraphQL type.
 */
@InputType('UserSortInput')
export class UserSortInput extends createSortInput(
  UserQueryableField,
  'User',
) {}
