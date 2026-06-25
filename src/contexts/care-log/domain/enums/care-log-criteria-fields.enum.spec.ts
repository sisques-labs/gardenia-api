import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogFilterFieldEnum } from './care-log-filter-field.enum';
import { CareLogSortFieldEnum } from './care-log-sort-field.enum';

/**
 * Guards against drift: every criteria field enum value MUST be a real
 * `CareLogEntryViewModel` field, since the value flows straight into `Criteria` and
 * is used as the persistence column.
 */
describe('Care log criteria field enums', () => {
  // `BaseViewModel` stores id/createdAt/updatedAt as `_`-prefixed fields exposed
  // through getters; normalize the prefix to compare against the public field surface.
  const viewModelFields = Object.keys(
    new CareLogEntryViewModel({
      id: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      plantId: 'plant',
      userId: 'user',
      spaceId: 'space',
      activityType: 'WATERING',
      performedAt: new Date(),
      notes: null,
      quantity: null,
      unit: null,
    }),
  ).map((key) => key.replace(/^_/, ''));

  it.each(Object.values(CareLogFilterFieldEnum))(
    'filter field "%s" is a CareLogEntryViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );

  it.each(Object.values(CareLogSortFieldEnum))(
    'sort field "%s" is a CareLogEntryViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );
});
