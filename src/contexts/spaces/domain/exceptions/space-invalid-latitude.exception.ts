import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceInvalidLatitudeException extends BaseException {
  constructor(value: number) {
    super(`Invalid latitude value: ${value}. Must be between -90 and 90`);
  }
}
