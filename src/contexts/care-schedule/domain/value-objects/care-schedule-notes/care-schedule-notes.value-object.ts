import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleNotesValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: CareScheduleNotesValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
