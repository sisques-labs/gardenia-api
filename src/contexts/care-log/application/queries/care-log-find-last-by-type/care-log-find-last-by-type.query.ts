import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { ICareLogEntryPrimitives } from '@contexts/care-log/domain/primitives/care-log-entry.primitives';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type CareLogFindLastByTypeQueryInput = Pick<
  ICareLogEntryPrimitives,
  'plantId' | 'activityType'
>;

export class CareLogFindLastByTypeQuery {
  public readonly plantId: UuidValueObject;
  public readonly activityType: CareLogActivityTypeValueObject;

  constructor(input: CareLogFindLastByTypeQueryInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.activityType = new CareLogActivityTypeValueObject(
      input.activityType as CareLogActivityTypeEnum,
    );
  }
}
