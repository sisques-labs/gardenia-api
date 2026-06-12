export interface CareLogFindBySpaceQueryInput {
  activityTypes?: string[];
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export class CareLogFindBySpaceQuery {
  public readonly activityTypes?: string[];
  public readonly fromDate?: Date;
  public readonly toDate?: Date;
  public readonly page: number;
  public readonly limit: number;

  constructor(input: CareLogFindBySpaceQueryInput) {
    this.activityTypes = input.activityTypes;
    this.fromDate = input.fromDate;
    this.toDate = input.toDate;
    this.page = input.page ?? 1;
    this.limit = Math.min(input.limit ?? 20, 100);
  }
}
