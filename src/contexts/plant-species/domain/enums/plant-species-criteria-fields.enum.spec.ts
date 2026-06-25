import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';

import { PlantSpeciesFilterFieldEnum } from './plant-species-filter-field.enum';
import { PlantSpeciesSortFieldEnum } from './plant-species-sort-field.enum';

/**
 * Guards against drift: every criteria field enum value MUST be a real
 * `PlantSpeciesViewModel` field, since the value flows straight into `Criteria` and
 * is used as the persistence column.
 */
describe('Plant species criteria field enums', () => {
  // `BaseViewModel` stores id/createdAt/updatedAt as `_`-prefixed fields exposed
  // through getters; normalize the prefix to compare against the public field surface.
  const viewModelFields = Object.keys(
    new PlantSpeciesViewModel({
      id: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      scientificName: 'Solanum lycopersicum',
      description: null,
      imageUrl: null,
    }),
  ).map((key) => key.replace(/^_/, ''));

  it.each(Object.values(PlantSpeciesFilterFieldEnum))(
    'filter field "%s" is a PlantSpeciesViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );

  it.each(Object.values(PlantSpeciesSortFieldEnum))(
    'sort field "%s" is a PlantSpeciesViewModel field',
    (value) => {
      expect(viewModelFields).toContain(value);
    },
  );
});
