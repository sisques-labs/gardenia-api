import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { ISensorReadingPrimitives } from '@contexts/sensor-readings/domain/primitives/sensor-reading.primitives';

export class SensorReadingViewModel extends BaseViewModel {
  public readonly plantId: string;
  public readonly spaceId: string;
  public readonly metric: string;
  public readonly value: number;
  public readonly unit: string;
  public readonly measuredAt: Date;
  public readonly source: string;

  constructor(props: ISensorReadingPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.plantId = props.plantId;
    this.spaceId = props.spaceId;
    this.metric = props.metric;
    this.value = props.value;
    this.unit = props.unit;
    this.measuredAt = props.measuredAt;
    this.source = props.source;
  }
}
