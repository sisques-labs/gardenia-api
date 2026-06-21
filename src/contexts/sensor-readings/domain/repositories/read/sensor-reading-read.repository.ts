import { SensorReadingViewModel } from '@contexts/sensor-readings/domain/view-models/sensor-reading.view-model';

export const SENSOR_READING_READ_REPOSITORY = Symbol(
  'SENSOR_READING_READ_REPOSITORY',
);

export interface ISensorReadingReadRepository {
  /** The most recent reading per metric for a plant (one row per metric). */
  findLatestByPlant(plantId: string): Promise<SensorReadingViewModel[]>;
}
