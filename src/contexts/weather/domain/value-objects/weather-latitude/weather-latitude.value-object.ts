import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class WeatherLatitudeValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value);
  }
}
