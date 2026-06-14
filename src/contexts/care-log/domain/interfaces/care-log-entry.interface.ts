import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogNotesValueObject } from '@contexts/care-log/domain/value-objects/care-log-notes/care-log-notes.value-object';
import { CareLogPerformedAtValueObject } from '@contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object';
import { CareLogQuantityValueObject } from '@contexts/care-log/domain/value-objects/care-log-quantity/care-log-quantity.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

export interface ICareLogEntry {
  id: CareLogIdValueObject;
  plantId: UuidValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  activityType: CareLogActivityTypeValueObject;
  performedAt: CareLogPerformedAtValueObject;
  notes: CareLogNotesValueObject | null;
  quantity: CareLogQuantityValueObject | null;
  unit: CareLogUnitValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
