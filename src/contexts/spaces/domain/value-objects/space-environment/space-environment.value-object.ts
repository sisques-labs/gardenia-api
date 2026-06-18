import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';

export class SpaceEnvironmentValueObject {
  constructor(public readonly value: SpaceEnvironmentEnum) {
    if (!Object.values(SpaceEnvironmentEnum).includes(value)) {
      throw new Error(`Invalid environment: ${value}`);
    }
  }
}
