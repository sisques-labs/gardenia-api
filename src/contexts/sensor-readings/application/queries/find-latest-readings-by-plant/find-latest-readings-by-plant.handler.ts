import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ISensorReadingReadRepository,
  SENSOR_READING_READ_REPOSITORY,
} from '@contexts/sensor-readings/domain/repositories/read/sensor-reading-read.repository';
import { SensorReadingViewModel } from '@contexts/sensor-readings/domain/view-models/sensor-reading.view-model';

import { FindLatestReadingsByPlantQuery } from './find-latest-readings-by-plant.query';

@QueryHandler(FindLatestReadingsByPlantQuery)
export class FindLatestReadingsByPlantQueryHandler implements IQueryHandler<
  FindLatestReadingsByPlantQuery,
  SensorReadingViewModel[]
> {
  private readonly logger = new Logger(
    FindLatestReadingsByPlantQueryHandler.name,
  );

  constructor(
    @Inject(SENSOR_READING_READ_REPOSITORY)
    private readonly repository: ISensorReadingReadRepository,
  ) {}

  async execute(
    query: FindLatestReadingsByPlantQuery,
  ): Promise<SensorReadingViewModel[]> {
    this.logger.log(`Finding latest readings for plant ${query.plantId.value}`);
    return this.repository.findLatestByPlant(query.plantId.value);
  }
}
