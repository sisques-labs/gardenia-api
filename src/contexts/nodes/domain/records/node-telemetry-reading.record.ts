import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';

/**
 * Insert-only historical record — deliberately NOT a `BaseAggregate`. A
 * reading has no invariants beyond "store this data point" (no lifecycle,
 * no domain events, no update/delete through the application layer). See
 * design.md §3.4 for the rationale.
 */
export class NodeTelemetryReading {
  private constructor(
    public readonly id: string,
    public readonly spaceId: string,
    public readonly nodeId: string,
    public readonly sensorType: SensorTypeEnum,
    public readonly value: number,
    public readonly unit: string | null,
    public readonly recordedAt: Date,
  ) {}

  static create(props: {
    spaceId: string;
    nodeId: string;
    sensorType: SensorTypeEnum;
    value: number;
    unit: string | null;
    recordedAt: Date;
  }): NodeTelemetryReading {
    return new NodeTelemetryReading(
      UuidValueObject.generate().value,
      props.spaceId,
      props.nodeId,
      props.sensorType,
      props.value,
      props.unit,
      props.recordedAt,
    );
  }
}
