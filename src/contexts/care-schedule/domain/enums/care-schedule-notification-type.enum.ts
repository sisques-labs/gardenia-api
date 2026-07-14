/**
 * The notification type(s) care-schedule can report on. Kept local to
 * care-schedule (not notifications' NotificationTypeEnum) so the port
 * doesn't leak the target context's domain outside infrastructure/adapters —
 * if care-schedule is ever split out of the monolith, this enum travels with
 * it unchanged.
 */
export enum CareScheduleNotificationTypeEnum {
  DUE = 'DUE',
}
