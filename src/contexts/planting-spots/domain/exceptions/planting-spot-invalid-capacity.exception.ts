import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantingSpotInvalidCapacityException extends BaseException {
  constructor(value: number) {
    super(
      `Invalid capacity '${value}': must be a positive integer >= 1`,
    );
  }
}
