import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { SensorReadingAggregate } from '@contexts/sensor-readings/domain/aggregates/sensor-reading.aggregate';

export const SENSOR_READING_WRITE_REPOSITORY = Symbol(
  'SENSOR_READING_WRITE_REPOSITORY',
);

export type ISensorReadingWriteRepository =
  IBaseWriteRepository<SensorReadingAggregate>;
