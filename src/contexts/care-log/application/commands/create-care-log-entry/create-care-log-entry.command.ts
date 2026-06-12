import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

export interface CreateCareLogEntryCommandInput {
  plantId: string;
  userId: string;
  spaceId: string;
  activityType: string;
  performedAt?: Date;
  notes?: string;
  quantity?: number;
  unit?: string;
}

export class CreateCareLogEntryCommand {
  public readonly plantId: UuidValueObject;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;
  public readonly activityType: CareLogActivityTypeValueObject;
  public readonly performedAt?: Date;
  public readonly notes?: string;
  public readonly quantity?: number;
  public readonly unit?: CareLogUnitValueObject;

  constructor(input: CreateCareLogEntryCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
    this.activityType = new CareLogActivityTypeValueObject(
      input.activityType as CareLogActivityTypeEnum,
    );
    this.performedAt = input.performedAt;
    this.notes = input.notes;
    this.quantity = input.quantity;
    this.unit =
      input.unit != null
        ? new CareLogUnitValueObject(input.unit as CareLogUnitEnum)
        : undefined;
  }
}
