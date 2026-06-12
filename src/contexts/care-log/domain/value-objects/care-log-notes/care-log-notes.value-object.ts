import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class CareLogNotesValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    if (!value || value.trim().length === 0) {
      throw new Error('CareLogNotesValueObject: notes cannot be empty');
    }
    if (value.length > 2000) {
      throw new Error(
        'CareLogNotesValueObject: notes cannot exceed 2000 characters',
      );
    }
  }
}
