import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class UserTaskTitleValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }
}
