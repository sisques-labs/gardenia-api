import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class HarvestIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}
