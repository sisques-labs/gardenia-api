import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotFilterFieldEnum } from './planting-spot-filter-field.enum';
import { PlantingSpotSortFieldEnum } from './planting-spot-sort-field.enum';

/**
 * Guards against drift: every criteria field enum value MUST be a real
 * `PlantingSpotViewModel` field, since the value flows straight into `Criteria` and
 * is used as the persistence column.
 */
describe('Planting spot criteria field enums', () => {
  // `BaseViewModel` stores id/createdAt/updatedAt as `_`-prefixed fields exposed
  // through getters; normalize the prefix to compare against the public field surface.
  const viewModelFields = Object.keys(
    new PlantingSpotViewModel({
      id: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'Bed A',
      type: 'BED',
      description: null,
      capacity: null,
      row: null,
      column: null,
      dimensionsWidth: null,
      dimensionsHeight: null,
      dimensionsLength: null,
      soilType: null,
      userId: 'user',
      spaceId: 'space',
    }),
  ).map((key) => key.replace(/^_/, ''));

  it.each(Object.values(PlantingSpotFilterFieldEnum))(
    'filter field "%s" is a PlantingSpotViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );

  it.each(Object.values(PlantingSpotSortFieldEnum))(
    'sort field "%s" is a PlantingSpotViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );
});
