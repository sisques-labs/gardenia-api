import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotInvalidCapacityException } from '@contexts/planting-spots/domain/exceptions/planting-spot-invalid-capacity.exception';

export class PlantingSpotCapacityValueObject extends NumberValueObject {
  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new PlantingSpotInvalidCapacityException(value);
    }
    try {
      super(value, { min: 1 });
    } catch {
      throw new PlantingSpotInvalidCapacityException(value);
    }
  }
}
