import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * The measured quantity, e.g. `moisture`, `temperature`, `light`. Free-form
 * (an open set) but normalized to a non-empty, bounded, lower-case token.
 */
export class SensorMetricValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 50;

  constructor(value: string) {
    super(value?.trim().toLowerCase(), {
      maxLength: SensorMetricValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
