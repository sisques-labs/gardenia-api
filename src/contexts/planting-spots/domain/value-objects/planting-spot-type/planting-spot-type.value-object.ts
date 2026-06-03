import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

export class PlantingSpotTypeValueObject extends EnumValueObject<
  typeof PlantingSpotTypeEnum
> {
  constructor(value: PlantingSpotTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof PlantingSpotTypeEnum {
    return PlantingSpotTypeEnum as unknown as typeof PlantingSpotTypeEnum;
  }
}
