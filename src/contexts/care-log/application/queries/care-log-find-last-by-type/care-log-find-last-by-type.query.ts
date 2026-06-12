export interface CareLogFindLastByTypeQueryInput {
  plantId: string;
  activityType: string;
}

export class CareLogFindLastByTypeQuery {
  public readonly plantId: string;
  public readonly activityType: string;

  constructor(input: CareLogFindLastByTypeQueryInput) {
    this.plantId = input.plantId;
    this.activityType = input.activityType;
  }
}
