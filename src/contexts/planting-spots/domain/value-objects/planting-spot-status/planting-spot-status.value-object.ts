import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';

export class PlantingSpotStatusValueObject extends EnumValueObject<
  typeof PlantingSpotStatusEnum
> {
  constructor(value: PlantingSpotStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof PlantingSpotStatusEnum {
    return PlantingSpotStatusEnum as unknown as typeof PlantingSpotStatusEnum;
  }
}
