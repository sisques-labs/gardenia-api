import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceInvalidLongitudeException } from '../../exceptions/space-invalid-longitude.exception';

export class SpaceLongitudeValueObject extends NumberValueObject {
  static readonly MIN = -180;
  static readonly MAX = 180;

  constructor(value: number) {
    if (value < SpaceLongitudeValueObject.MIN || value > SpaceLongitudeValueObject.MAX) {
      throw new SpaceInvalidLongitudeException(value);
    }
    super(value);
  }
}
