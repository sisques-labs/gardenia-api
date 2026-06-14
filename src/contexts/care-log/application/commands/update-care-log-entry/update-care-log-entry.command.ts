import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { ICareLogEntryPrimitives } from '@contexts/care-log/domain/primitives/care-log-entry.primitives';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogNotesValueObject } from '@contexts/care-log/domain/value-objects/care-log-notes/care-log-notes.value-object';
import { CareLogPerformedAtValueObject } from '@contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object';
import { CareLogQuantityValueObject } from '@contexts/care-log/domain/value-objects/care-log-quantity/care-log-quantity.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

export type UpdateCareLogEntryCommandInput = Pick<
  ICareLogEntryPrimitives,
  'id'
> & {
  requestingUserId: string;
} & Partial<
    Omit<
      ICareLogEntryPrimitives,
      'id' | 'plantId' | 'userId' | 'spaceId' | 'createdAt' | 'updatedAt'
    >
  >;

export class UpdateCareLogEntryCommand {
  public readonly id: CareLogIdValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly activityType?: CareLogActivityTypeValueObject;
  public readonly performedAt?: CareLogPerformedAtValueObject;
  public readonly notes?: CareLogNotesValueObject | null;
  public readonly quantity?: CareLogQuantityValueObject | null;
  public readonly unit?: CareLogUnitValueObject | null;

  constructor(input: UpdateCareLogEntryCommandInput) {
    this.id = new CareLogIdValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.activityType =
      input.activityType != null
        ? new CareLogActivityTypeValueObject(
            input.activityType as CareLogActivityTypeEnum,
          )
        : undefined;
    this.performedAt =
      input.performedAt != null
        ? new CareLogPerformedAtValueObject(input.performedAt)
        : undefined;
    this.notes =
      input.notes !== undefined
        ? input.notes != null
          ? new CareLogNotesValueObject(input.notes)
          : null
        : undefined;
    this.quantity =
      input.quantity !== undefined
        ? input.quantity != null
          ? new CareLogQuantityValueObject(input.quantity)
          : null
        : undefined;
    this.unit =
      input.unit !== undefined
        ? input.unit != null
          ? new CareLogUnitValueObject(input.unit as CareLogUnitEnum)
          : null
        : undefined;
  }
}
