import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceInvalidLatitudeException } from '../../exceptions/space-invalid-latitude.exception';

export class SpaceLatitudeValueObject extends NumberValueObject {
  static readonly MIN = -90;
  static readonly MAX = 90;

  constructor(value: number) {
    super(value);
    this.validate();
  }

  protected validate(): void {
    if (this.value < SpaceLatitudeValueObject.MIN || this.value > SpaceLatitudeValueObject.MAX) {
      throw new SpaceInvalidLatitudeException(this.value);
    }
  }
}
