import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class NotificationDedupeKeyValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }

  static compute(type: string, referenceId: string): string {
    return `${type}:${referenceId}`;
  }
}
