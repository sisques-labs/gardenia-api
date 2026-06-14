import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { ICareLogEntryPrimitives } from '@contexts/care-log/domain/primitives/care-log-entry.primitives';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';

export type CareLogFindLastByTypeQueryInput = Pick<
  ICareLogEntryPrimitives,
  'plantId' | 'activityType'
>;

export class CareLogFindLastByTypeQuery {
  public readonly plantId: string;
  public readonly activityType: CareLogActivityTypeValueObject;

  constructor(input: CareLogFindLastByTypeQueryInput) {
    this.plantId = input.plantId;
    this.activityType = new CareLogActivityTypeValueObject(
      input.activityType as CareLogActivityTypeEnum,
    );
  }
}
