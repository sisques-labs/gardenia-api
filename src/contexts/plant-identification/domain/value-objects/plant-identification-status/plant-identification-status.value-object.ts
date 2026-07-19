import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

export class PlantIdentificationStatusValueObject extends EnumValueObject<
  typeof PlantIdentificationStatusEnum
> {
  constructor(value: PlantIdentificationStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof PlantIdentificationStatusEnum {
    return PlantIdentificationStatusEnum as unknown as typeof PlantIdentificationStatusEnum;
  }
}
