import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotIdValueObject } from '../value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '../value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '../value-objects/planting-spot-type/planting-spot-type.value-object';
import { PlantingSpotDescriptionValueObject } from '../value-objects/planting-spot-description/planting-spot-description.value-object';

export interface IPlantingSpot {
  id: PlantingSpotIdValueObject;
  name: PlantingSpotNameValueObject;
  type: PlantingSpotTypeValueObject;
  description: PlantingSpotDescriptionValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
