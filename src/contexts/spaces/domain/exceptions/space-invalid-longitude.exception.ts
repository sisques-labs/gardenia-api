import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceInvalidLongitudeException extends BaseException {
  constructor(value: number) {
    super(`Invalid longitude value: ${value}. Must be between -180 and 180`);
  }
}
