import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';

export class NotificationTypeValueObject extends EnumValueObject<
  typeof NotificationTypeEnum
> {
  constructor(value: NotificationTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof NotificationTypeEnum {
    return NotificationTypeEnum as unknown as typeof NotificationTypeEnum;
  }
}
