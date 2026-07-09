import { PlantPhotoQueryableField } from '@contexts/plant-photos/transport/graphql/enums/plant-photo-queryable-field.enum';
import { plantPhotoFilterableFields } from './plant-photo-filterable-fields.registry';

describe('plantPhotoFilterableFields', () => {
  it('has a registry entry for every PlantPhotoQueryableField value', () => {
    for (const field of Object.values(PlantPhotoQueryableField)) {
      expect(plantPhotoFilterableFields[field]).toBeDefined();
    }
  });

  it('rejects fields not in the whitelist', () => {
    expect(
      (plantPhotoFilterableFields as Record<string, unknown>).spaceId,
    ).toBeUndefined();
  });
});
