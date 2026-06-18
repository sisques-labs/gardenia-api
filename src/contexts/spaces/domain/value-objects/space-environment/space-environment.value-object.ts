import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceEnvironmentEnum } from '../../enums/space-environment.enum';
import { SpaceInvalidEnvironmentException } from '../../exceptions/space-invalid-environment.exception';

export class SpaceEnvironmentValueObject extends EnumValueObject<SpaceEnvironmentEnum> {
  constructor(value: SpaceEnvironmentEnum) {
    if (!Object.values(SpaceEnvironmentEnum).includes(value)) {
      throw new SpaceInvalidEnvironmentException(value);
    }
    super(value, Object.values(SpaceEnvironmentEnum));
  }
}
