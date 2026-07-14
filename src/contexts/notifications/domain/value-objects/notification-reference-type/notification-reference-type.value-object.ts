import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Deliberately NOT a closed enum: see NotificationTypeValueObject — the set
 * of referenceable entity kinds is defined by whichever bounded context
 * dispatches the notification, not by notifications itself.
 */
export class NotificationReferenceTypeValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false, maxLength: 50 });
  }
}
