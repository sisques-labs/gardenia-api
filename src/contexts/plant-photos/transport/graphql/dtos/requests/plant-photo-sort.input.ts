import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit';

import { PlantPhotoQueryableField } from '@contexts/plant-photos/transport/graphql/enums/plant-photo-queryable-field.enum';

@InputType('PlantPhotoSortInput')
export class PlantPhotoSortInput extends createSortInput(
  PlantPhotoQueryableField,
  'PlantPhoto',
) {}
