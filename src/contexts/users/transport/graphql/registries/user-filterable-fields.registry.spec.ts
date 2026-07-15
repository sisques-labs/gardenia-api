import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { UserQueryableField } from '@contexts/users/transport/graphql/enums/user/user-queryable-field.enum';
import { userFilterableFields } from '@contexts/users/transport/graphql/registries/user-filterable-fields.registry';

describe('userFilterableFields', () => {
  const pipe = new FilterValidationPipe(userFilterableFields);

  it('has an entry for every UserQueryableField value', () => {
    for (const field of Object.values(UserQueryableField)) {
      expect(userFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on status with a real UserStatusEnum value', () => {
    const input = {
      filters: [
        {
          field: UserQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: UserStatusEnum.ACTIVE,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a status value outside UserStatusEnum', () => {
    const input = {
      filters: [
        {
          field: UserQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: 'DELETED',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
  });

  it('accepts an IN filter on status with multiple UserStatusEnum values', () => {
    const input = {
      filters: [
        {
          field: UserQueryableField.STATUS,
          operator: FilterOperator.IN,
          value: [UserStatusEnum.ACTIVE, UserStatusEnum.INACTIVE],
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('accepts a LIKE filter on username with a string value', () => {
    const input = {
      filters: [
        {
          field: UserQueryableField.USERNAME,
          operator: FilterOperator.LIKE,
          value: 'jane',
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a filter on a field outside the whitelist (e.g. spaceId — deliberately excluded, already tenant-scoped)', () => {
    const input = {
      filters: [
        { field: 'spaceId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });
});
