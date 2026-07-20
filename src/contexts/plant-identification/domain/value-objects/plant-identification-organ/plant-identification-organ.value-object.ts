import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';

export class PlantIdentificationOrganValueObject extends EnumValueObject<
  typeof PlantIdentificationOrganEnum
> {
  constructor(value: PlantIdentificationOrganEnum) {
    super(value);
  }

  protected get enumObject(): typeof PlantIdentificationOrganEnum {
    return PlantIdentificationOrganEnum as unknown as typeof PlantIdentificationOrganEnum;
  }
}
