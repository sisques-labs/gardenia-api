import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class CareLogNotesValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: CareLogNotesValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
