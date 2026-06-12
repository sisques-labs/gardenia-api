import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class CareLogIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}
