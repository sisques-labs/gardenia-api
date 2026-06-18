export class SpaceLongitudeValueObject {
  constructor(public readonly value: number) {
    if (value < -180 || value > 180) {
      throw new Error(`Invalid longitude: ${value}`);
    }
  }
}
