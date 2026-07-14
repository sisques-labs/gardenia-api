import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Deliberately NOT a closed enum: the set of notification types is defined
 * by whichever bounded context dispatches UpsertConditionNotificationCommand
 * (care-schedule, inventory, ...), not by notifications itself. A closed
 * enum here would force notifications' domain to be edited every time a
 * source context adds a new condition, re-coupling it to contexts it must
 * stay ignorant of.
 */
export class NotificationTypeValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false, maxLength: 50 });
  }
}
