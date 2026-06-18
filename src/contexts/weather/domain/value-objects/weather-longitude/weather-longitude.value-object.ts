import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class WeatherLongitudeValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value);
  }
}
