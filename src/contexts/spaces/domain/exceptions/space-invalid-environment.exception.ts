import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceInvalidEnvironmentException extends BaseException {
  constructor(value: string) {
    super(`Invalid environment value: ${value}. Must be INDOOR, OUTDOOR, or MIXED`);
  }
}
