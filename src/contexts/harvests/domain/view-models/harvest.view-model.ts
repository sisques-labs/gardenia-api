import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IHarvestPrimitives } from '@contexts/harvests/domain/primitives/harvest.primitives';

export class HarvestViewModel extends BaseViewModel {
  public readonly cropType: string;
  public readonly quantity: number;
  public readonly unit: string;
  public readonly harvestedAt: Date;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IHarvestPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.cropType = props.cropType;
    this.quantity = props.quantity;
    this.unit = props.unit;
    this.harvestedAt = props.harvestedAt;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
