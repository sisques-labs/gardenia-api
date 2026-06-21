import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { SensorMetricValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-metric/sensor-metric.value-object';
import { SensorReadingIdValueObject } from '@contexts/sensor-readings/domain/value-objects/sensor-reading-id/sensor-reading-id.value-object';

export interface ISensorReading {
  id: SensorReadingIdValueObject;
  plantId: UuidValueObject;
  spaceId: UuidValueObject;
  metric: SensorMetricValueObject;
  value: NumberValueObject;
  unit: StringValueObject;
  measuredAt: DateValueObject;
  source: StringValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
