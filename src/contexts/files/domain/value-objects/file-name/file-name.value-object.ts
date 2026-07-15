import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class FileNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 255;

  constructor(value: string) {
    super(value, {
      maxLength: FileNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
