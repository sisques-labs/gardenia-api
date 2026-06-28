import {
  BooleanValueObject,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleLastCompletedAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-last-completed-at/care-schedule-last-completed-at.value-object';
import { CareScheduleNextDueAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-next-due-at/care-schedule-next-due-at.value-object';
import { CareScheduleNotesValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-notes/care-schedule-notes.value-object';
import { CareScheduleQuantityValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-quantity/care-schedule-quantity.value-object';
import { CareScheduleUnitValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-unit/care-schedule-unit.value-object';

export interface ICareSchedule {
  id: CareScheduleIdValueObject;
  plantId: UuidValueObject;
  activityType: CareScheduleActivityTypeValueObject;
  intervalDays: CareScheduleIntervalDaysValueObject;
  quantity: CareScheduleQuantityValueObject | null;
  unit: CareScheduleUnitValueObject | null;
  notes: CareScheduleNotesValueObject | null;
  nextDueAt: CareScheduleNextDueAtValueObject;
  lastCompletedAt: CareScheduleLastCompletedAtValueObject | null;
  active: BooleanValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
