export class PlantingSpotColumnValueObject {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(
        `PlantingSpotColumn must be a positive integer, got: ${value}`,
      );
    }
  }
}
