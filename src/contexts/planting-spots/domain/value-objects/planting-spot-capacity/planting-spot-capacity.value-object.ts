export class PlantingSpotCapacityValueObject {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(
        `PlantingSpotCapacity must be a positive integer, got: ${value}`,
      );
    }
  }
}
