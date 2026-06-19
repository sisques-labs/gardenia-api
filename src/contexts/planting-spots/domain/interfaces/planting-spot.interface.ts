import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotCapacityValueObject } from '../value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '../value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '../value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '../value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotIdValueObject } from '../value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '../value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '../value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '../value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
import { PlantingSpotTypeValueObject } from '../value-objects/planting-spot-type/planting-spot-type.value-object';

export interface IPlantingSpot {
  id: PlantingSpotIdValueObject;
  name: PlantingSpotNameValueObject;
  type: PlantingSpotTypeValueObject;
  description: PlantingSpotDescriptionValueObject | null;
  capacity: PlantingSpotCapacityValueObject | null;
  row: PlantingSpotRowValueObject | null;
  column: PlantingSpotColumnValueObject | null;
  dimensions: PlantingSpotDimensionsValueObject | null;
  soilType: PlantingSpotSoilTypeValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
