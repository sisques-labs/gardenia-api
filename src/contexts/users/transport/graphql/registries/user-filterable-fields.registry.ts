import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { UserQueryableField } from '@contexts/users/transport/graphql/enums/user/user-queryable-field.enum';

/**
 * Expected `Filter.value` shape per {@link UserQueryableField}, consumed by
 * `FilterValidationPipe`. `status` validates membership in `UserStatusEnum`
 * (the real domain enum) — the value must come from that enum, never a
 * duplicated list of accepted strings.
 */
export const userFilterableFields: FilterFieldRegistry<UserQueryableField> = {
  [UserQueryableField.ID]: { type: 'uuid' },
  [UserQueryableField.STATUS]: { type: 'enum', enum: UserStatusEnum },
  [UserQueryableField.USERNAME]: { type: 'string' },
  [UserQueryableField.FIRST_NAME]: { type: 'string' },
  [UserQueryableField.LAST_NAME]: { type: 'string' },
  [UserQueryableField.AVATAR_URL]: { type: 'string' },
  [UserQueryableField.BIO]: { type: 'string' },
  [UserQueryableField.LOCALE]: { type: 'string' },
  [UserQueryableField.TIMEZONE]: { type: 'string' },
  [UserQueryableField.CREATED_AT]: { type: 'date' },
  [UserQueryableField.UPDATED_AT]: { type: 'date' },
};
