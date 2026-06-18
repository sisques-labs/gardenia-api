import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceInvalidLatitudeException } from '../../exceptions/space-invalid-latitude.exception';

export class SpaceLatitudeValueObject extends NumberValueObject {
  static readonly MIN = -90;
  static readonly MAX = 90;

  constructor(value: number) {
    if (value < SpaceLatitudeValueObject.MIN || value > SpaceLatitudeValueObject.MAX) {
      throw new SpaceInvalidLatitudeException(value);
    }
    super(value);
  }
}
