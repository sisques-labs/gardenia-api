import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

import { HarvestFilterFieldEnum } from './harvest-filter-field.enum';
import { HarvestSortFieldEnum } from './harvest-sort-field.enum';

/**
 * Guards against drift: every criteria field enum value MUST be a real
 * `HarvestViewModel` field, since the value flows straight into `Criteria` and is
 * used as the persistence column.
 */
describe('Harvest criteria field enums', () => {
  // `BaseViewModel` stores id/createdAt/updatedAt as `_`-prefixed fields exposed
  // through getters; normalize the prefix to compare against the public field surface.
  const viewModelFields = Object.keys(
    new HarvestViewModel({
      id: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      cropType: 'tomato',
      quantity: 1,
      unit: 'KG',
      harvestedAt: new Date(),
      userId: 'user',
      spaceId: 'space',
    }),
  ).map((key) => key.replace(/^_/, ''));

  it.each(Object.values(HarvestFilterFieldEnum))(
    'filter field "%s" is a HarvestViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );

  it.each(Object.values(HarvestSortFieldEnum))(
    'sort field "%s" is a HarvestViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );
});
