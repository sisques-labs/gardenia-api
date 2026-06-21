import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { SensorMetricValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-metric/sensor-metric.value-object';

export interface RecordSensorReadingCommandInput {
  plantId: string;
  spaceId: string;
  metric: string;
  value: number;
  unit?: string;
  measuredAt?: Date;
  source?: string;
}

export class RecordSensorReadingCommand {
  public readonly plantId: UuidValueObject;
  public readonly spaceId: UuidValueObject;
  public readonly metric: SensorMetricValueObject;
  public readonly value: NumberValueObject;
  public readonly unit: StringValueObject;
  public readonly measuredAt: DateValueObject;
  public readonly source: StringValueObject;

  constructor(input: RecordSensorReadingCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.spaceId = new UuidValueObject(input.spaceId);
    this.metric = new SensorMetricValueObject(input.metric);
    this.value = new NumberValueObject(input.value);
    this.unit = new StringValueObject(input.unit ?? '');
    this.measuredAt = new DateValueObject(input.measuredAt ?? new Date());
    this.source = new StringValueObject(input.source ?? '');
  }
}
