import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { UserQueryableField } from '@contexts/users/transport/graphql/enums/user/user-queryable-field.enum';

/**
 * `field` is typed to {@link UserQueryableField} instead of a free string.
 * `createFilterInput` registers its returned class `{ isAbstract: true }`, so
 * this subclass needs its own `@InputType` to actually register a concrete
 * GraphQL type.
 */
@InputType('UserFilterInput')
export class UserFilterInput extends createFilterInput(
  UserQueryableField,
  'User',
) {}
