import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationQueryableField } from '@contexts/plant-identification/transport/graphql/enums/plant-identification-queryable-field.enum';

export const plantIdentificationFilterableFields: FilterFieldRegistry<PlantIdentificationQueryableField> =
  {
    [PlantIdentificationQueryableField.ID]: { type: 'uuid' },
    [PlantIdentificationQueryableField.STATUS]: {
      type: 'enum',
      enum: PlantIdentificationStatusEnum,
    },
    [PlantIdentificationQueryableField.REQUESTED_BY_USER_ID]: {
      type: 'uuid',
    },
    [PlantIdentificationQueryableField.CREATED_AT]: { type: 'date' },
    [PlantIdentificationQueryableField.UPDATED_AT]: { type: 'date' },
  };
