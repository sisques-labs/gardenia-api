import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceEnvironmentEnum } from '../../enums/space-environment.enum';
import { SpaceInvalidEnvironmentException } from '../../exceptions/space-invalid-environment.exception';

export class SpaceEnvironmentValueObject extends EnumValueObject<typeof SpaceEnvironmentEnum> {
  constructor(value: SpaceEnvironmentEnum) {
    if (!Object.values(SpaceEnvironmentEnum).includes(value)) {
      throw new SpaceInvalidEnvironmentException(value);
    }
    super(value);
  }

  protected get enumObject(): typeof SpaceEnvironmentEnum {
    return SpaceEnvironmentEnum as unknown as typeof SpaceEnvironmentEnum;
  }
}
