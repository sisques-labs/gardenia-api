import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotQueryableField } from '@contexts/planting-spots/transport/graphql/enums/planting-spot-queryable-field.enum';

export const plantingSpotFilterableFields: FilterFieldRegistry<PlantingSpotQueryableField> =
  {
    [PlantingSpotQueryableField.ID]: { type: 'uuid' },
    [PlantingSpotQueryableField.NAME]: { type: 'string' },
    [PlantingSpotQueryableField.TYPE]: {
      type: 'enum',
      enum: PlantingSpotTypeEnum,
    },
    [PlantingSpotQueryableField.DESCRIPTION]: { type: 'string' },
    [PlantingSpotQueryableField.CAPACITY]: { type: 'number' },
    [PlantingSpotQueryableField.ROW]: { type: 'number' },
    [PlantingSpotQueryableField.COLUMN]: { type: 'number' },
    [PlantingSpotQueryableField.DIMENSIONS_WIDTH]: { type: 'number' },
    [PlantingSpotQueryableField.DIMENSIONS_HEIGHT]: { type: 'number' },
    [PlantingSpotQueryableField.DIMENSIONS_LENGTH]: { type: 'number' },
    [PlantingSpotQueryableField.SOIL_TYPE]: { type: 'string' },
    [PlantingSpotQueryableField.STATUS]: {
      type: 'enum',
      enum: PlantingSpotStatusEnum,
    },
    [PlantingSpotQueryableField.FALLOW_SINCE]: { type: 'date' },
    [PlantingSpotQueryableField.USER_ID]: { type: 'uuid' },
    [PlantingSpotQueryableField.CREATED_AT]: { type: 'date' },
    [PlantingSpotQueryableField.UPDATED_AT]: { type: 'date' },
  };
