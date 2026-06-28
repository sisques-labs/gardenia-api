import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';

export class CareScheduleViewModel extends BaseViewModel {
  public readonly plantId: string;
  public readonly activityType: string;
  public readonly intervalDays: number | null;
  public readonly quantity: number | null;
  public readonly unit: string | null;
  public readonly notes: string | null;
  public readonly nextDueAt: Date;
  public readonly lastCompletedAt: Date | null;
  public readonly active: boolean;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: ICareSchedulePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.plantId = props.plantId;
    this.activityType = props.activityType;
    this.intervalDays = props.intervalDays;
    this.quantity = props.quantity;
    this.unit = props.unit;
    this.notes = props.notes;
    this.nextDueAt = props.nextDueAt;
    this.lastCompletedAt = props.lastCompletedAt;
    this.active = props.active;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
