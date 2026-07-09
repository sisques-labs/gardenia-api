import { registerEnumType } from '@nestjs/graphql';

import { PlantPhotoQueryableField } from '@contexts/plant-photos/transport/graphql/enums/plant-photo-queryable-field.enum';

registerEnumType(PlantPhotoQueryableField, {
  name: 'PlantPhotoQueryableFieldEnum',
  description: 'The plant photo fields that can be filtered/sorted on',
});
