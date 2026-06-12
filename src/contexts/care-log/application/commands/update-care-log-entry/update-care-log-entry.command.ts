import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

export interface UpdateCareLogEntryCommandInput {
  id: string;
  requestingUserId: string;
  activityType?: string;
  performedAt?: Date;
  notes?: string | null;
  quantity?: number | null;
  unit?: string | null;
}

export class UpdateCareLogEntryCommand {
  public readonly id: CareLogIdValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly activityType?: CareLogActivityTypeValueObject;
  public readonly performedAt?: Date;
  public readonly notes?: string | null;
  public readonly quantity?: number | null;
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
    this.performedAt = input.performedAt;
    this.notes = input.notes;
    this.quantity = input.quantity;
    this.unit =
      input.unit !== undefined
        ? input.unit != null
          ? new CareLogUnitValueObject(input.unit as CareLogUnitEnum)
          : null
        : undefined;
  }
}
