import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';

export interface CareLogFindLastByTypeQueryInput {
  plantId: string;
  activityType: CareLogActivityTypeValueObject;
}

export class CareLogFindLastByTypeQuery {
  public readonly plantId: string;
  public readonly activityType: CareLogActivityTypeValueObject;

  constructor(input: CareLogFindLastByTypeQueryInput) {
    this.plantId = input.plantId;
    this.activityType = input.activityType;
  }
}
