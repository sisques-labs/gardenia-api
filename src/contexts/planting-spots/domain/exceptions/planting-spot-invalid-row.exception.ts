import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantingSpotInvalidRowException extends BaseException {
  constructor(value: number) {
    super(`Invalid row '${value}': must be a positive integer >= 1`);
  }
}
