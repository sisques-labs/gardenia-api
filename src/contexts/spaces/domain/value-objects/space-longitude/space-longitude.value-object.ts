import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceInvalidLongitudeException } from '../../exceptions/space-invalid-longitude.exception';

export class SpaceLongitudeValueObject extends NumberValueObject {
  static readonly MIN = -180;
  static readonly MAX = 180;

  constructor(value: number) {
    super(value);
    this.validate();
  }

  protected validate(): void {
    if (this.value < SpaceLongitudeValueObject.MIN || this.value > SpaceLongitudeValueObject.MAX) {
      throw new SpaceInvalidLongitudeException(this.value);
    }
  }
}
