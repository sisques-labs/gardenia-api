import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';

export class NotificationReferenceTypeValueObject extends EnumValueObject<
  typeof NotificationReferenceTypeEnum
> {
  constructor(value: NotificationReferenceTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof NotificationReferenceTypeEnum {
    return NotificationReferenceTypeEnum as unknown as typeof NotificationReferenceTypeEnum;
  }
}
