import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantingSpotInvalidColumnException extends BaseException {
  constructor(value: number) {
    super(`Invalid column '${value}': must be a positive integer >= 1`);
  }
}
