import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { PlantPhotoQueryableField } from '@contexts/plant-photos/transport/graphql/enums/plant-photo-queryable-field.enum';

export const plantPhotoFilterableFields: FilterFieldRegistry<PlantPhotoQueryableField> =
  {
    [PlantPhotoQueryableField.ID]: { type: 'uuid' },
    [PlantPhotoQueryableField.PLANT_ID]: { type: 'uuid' },
    [PlantPhotoQueryableField.FILE_ID]: { type: 'uuid' },
    [PlantPhotoQueryableField.USER_ID]: { type: 'uuid' },
    [PlantPhotoQueryableField.CREATED_AT]: { type: 'date' },
    [PlantPhotoQueryableField.UPDATED_AT]: { type: 'date' },
  };
