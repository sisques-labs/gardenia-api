import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class FileIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}
