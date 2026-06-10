import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class UserTaskDescriptionValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: true });
  }
}
