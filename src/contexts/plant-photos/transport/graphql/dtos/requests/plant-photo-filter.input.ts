import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { PlantPhotoQueryableField } from '@contexts/plant-photos/transport/graphql/enums/plant-photo-queryable-field.enum';

@InputType('PlantPhotoFilterInput')
export class PlantPhotoFilterInput extends createFilterInput(
  PlantPhotoQueryableField,
  'PlantPhoto',
) {}
