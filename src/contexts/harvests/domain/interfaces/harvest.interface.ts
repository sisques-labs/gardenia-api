import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';
import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';

export interface IHarvest {
  id: HarvestIdValueObject;
  cropType: HarvestCropTypeValueObject;
  quantity: HarvestQuantityValueObject;
  unit: HarvestUnitValueObject;
  harvestedAt: HarvestHarvestedAtValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
