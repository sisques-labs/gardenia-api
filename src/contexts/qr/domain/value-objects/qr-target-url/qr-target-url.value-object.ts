import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class QrTargetUrlValueObject extends StringValueObject {
  private static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: QrTargetUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
