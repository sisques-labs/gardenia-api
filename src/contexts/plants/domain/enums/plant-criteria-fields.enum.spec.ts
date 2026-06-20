import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import { PlantFilterFieldEnum } from './plant-filter-field.enum';
import { PlantSortFieldEnum } from './plant-sort-field.enum';

/**
 * Guards against drift: every criteria field enum value MUST be a real
 * `PlantViewModel` field, since the value flows straight into `Criteria` and is
 * used as the persistence column.
 */
describe('Plant criteria field enums', () => {
  // `BaseViewModel` stores id/createdAt/updatedAt as `_`-prefixed fields exposed
  // through getters; normalize the prefix to compare against the public field surface.
  const viewModelFields = Object.keys(
    new PlantViewModel({
      id: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'plant',
      plantSpeciesId: null,
      imageUrl: null,
      userId: 'user',
      spaceId: 'space',
      qrId: null,
      plantingSpotId: null,
    }),
  ).map((key) => key.replace(/^_/, ''));

  it.each(Object.values(PlantFilterFieldEnum))(
    'filter field "%s" is a PlantViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );

  it.each(Object.values(PlantSortFieldEnum))(
    'sort field "%s" is a PlantViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );
});
