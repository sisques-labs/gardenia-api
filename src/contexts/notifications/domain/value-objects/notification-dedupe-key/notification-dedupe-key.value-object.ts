import { StringValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';

export class NotificationDedupeKeyValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }

  static compute(type: NotificationTypeEnum, referenceId: string): string {
    return `${type}:${referenceId}`;
  }
}
