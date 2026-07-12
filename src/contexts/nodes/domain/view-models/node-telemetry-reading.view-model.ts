import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';

export class NodeTelemetryReadingViewModel extends BaseViewModel {
  public readonly spaceId: string;
  public readonly nodeId: string;
  public readonly sensorType: SensorTypeEnum;
  public readonly value: number;
  public readonly unit: string | null;
  public readonly recordedAt: Date;

  constructor(props: {
    id: string;
    spaceId: string;
    nodeId: string;
    sensorType: SensorTypeEnum;
    value: number;
    unit: string | null;
    recordedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.spaceId = props.spaceId;
    this.nodeId = props.nodeId;
    this.sensorType = props.sensorType;
    this.value = props.value;
    this.unit = props.unit;
    this.recordedAt = props.recordedAt;
  }
}
