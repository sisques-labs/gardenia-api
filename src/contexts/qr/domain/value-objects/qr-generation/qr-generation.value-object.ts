import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class QrGenerationValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value);
  }

  increment(): QrGenerationValueObject {
    return new QrGenerationValueObject(this.value + 1);
  }
}
