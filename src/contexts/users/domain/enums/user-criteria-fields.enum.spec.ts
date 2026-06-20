import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';

import { UserFilterFieldEnum } from './user-filter-field.enum';
import { UserSortFieldEnum } from './user-sort-field.enum';

/**
 * Guards against drift: every criteria field enum value MUST be a real
 * `UserViewModel` field, since the value flows straight into `Criteria` and is
 * used as the persistence column.
 */
describe('User criteria field enums', () => {
  // `BaseViewModel` stores id/createdAt/updatedAt as `_`-prefixed fields exposed
  // through getters; normalize the prefix to compare against the public field surface.
  const viewModelFields = Object.keys(
    new UserViewModel({
      id: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ACTIVE',
      username: 'user',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      bio: null,
      locale: null,
      timezone: null,
    }),
  ).map((key) => key.replace(/^_/, ''));

  it.each(Object.values(UserFilterFieldEnum))(
    'filter field "%s" is a UserViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );

  it.each(Object.values(UserSortFieldEnum))(
    'sort field "%s" is a UserViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );
});
