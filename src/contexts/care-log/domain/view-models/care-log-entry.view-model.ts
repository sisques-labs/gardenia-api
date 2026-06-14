import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { ICareLogEntryPrimitives } from '@contexts/care-log/domain/primitives/care-log-entry.primitives';

export class CareLogEntryViewModel extends BaseViewModel {
  public readonly plantId: string;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly activityType: string;
  public readonly performedAt: Date;
  public readonly notes: string | null;
  public readonly quantity: number | null;
  public readonly unit: string | null;

  constructor(props: ICareLogEntryPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.plantId = props.plantId;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.activityType = props.activityType;
    this.performedAt = props.performedAt;
    this.notes = props.notes;
    this.quantity = props.quantity;
    this.unit = props.unit;
  }
}
