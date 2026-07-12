import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';
import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';

export interface RecordTelemetryReadingCommandInput {
  nodeId: string;
  bridgeId: string;
  sensorType: SensorTypeEnum;
  value: number;
  unit: string | null;
  recordedAt: Date;
}

/**
 * Internal command — dispatched only by
 * `NodesKafkaConsumerBootstrapService`, never by transport. Inputs are
 * already parsed/validated by the Zod message parser.
 */
export class RecordTelemetryReadingCommand {
  public readonly nodeId: NodeIdValueObject;
  public readonly bridgeId: UuidValueObject;
  public readonly sensorType: SensorTypeEnum;
  public readonly value: number;
  public readonly unit: string | null;
  public readonly recordedAt: Date;

  constructor(input: RecordTelemetryReadingCommandInput) {
    this.nodeId = new NodeIdValueObject(input.nodeId);
    this.bridgeId = new UuidValueObject(input.bridgeId);
    this.sensorType = input.sensorType;
    this.value = input.value;
    this.unit = input.unit;
    this.recordedAt = input.recordedAt;
  }
}
