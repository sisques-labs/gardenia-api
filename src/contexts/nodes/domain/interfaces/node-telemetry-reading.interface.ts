import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';

export interface INodeTelemetryReading {
  spaceId: string;
  nodeId: string;
  sensorType: SensorTypeEnum;
  value: number;
  unit: string | null;
  recordedAt: Date;
}
