export class SpaceLatitudeValueObject {
  constructor(public readonly value: number) {
    if (value < -90 || value > 90) {
      throw new Error(`Invalid latitude: ${value}`);
    }
  }
}
