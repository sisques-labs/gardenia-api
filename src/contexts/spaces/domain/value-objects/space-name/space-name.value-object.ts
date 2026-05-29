import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class SpaceNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 100;

  constructor(value: string) {
    super(value, {
      maxLength: SpaceNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
