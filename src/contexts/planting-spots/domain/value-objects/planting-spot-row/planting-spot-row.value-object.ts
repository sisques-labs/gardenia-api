export class PlantingSpotRowValueObject {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(
        `PlantingSpotRow must be a positive integer, got: ${value}`,
      );
    }
  }
}
