/**
 * The notification type(s) care-schedule can report on. Kept local to
 * care-schedule (notifications has no enum of its own to depend on — its
 * `type` field is a plain string) so the port doesn't leak the target
 * context's domain outside infrastructure/adapters — if care-schedule is
 * ever split out of the monolith, this enum travels with it unchanged.
 */
export enum CareScheduleNotificationTypeEnum {
  DUE = 'DUE',
}
