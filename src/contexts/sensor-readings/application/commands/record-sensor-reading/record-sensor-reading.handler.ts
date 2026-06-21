import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SensorReadingBuilder } from '@contexts/sensor-readings/domain/builders/sensor-reading.builder';
import {
  ISensorReadingWriteRepository,
  SENSOR_READING_WRITE_REPOSITORY,
} from '@contexts/sensor-readings/domain/repositories/write/sensor-reading-write.repository';

import { RecordSensorReadingCommand } from './record-sensor-reading.command';

@CommandHandler(RecordSensorReadingCommand)
export class RecordSensorReadingCommandHandler implements ICommandHandler<
  RecordSensorReadingCommand,
  string
> {
  private readonly logger = new Logger(RecordSensorReadingCommandHandler.name);

  constructor(
    @Inject(SENSOR_READING_WRITE_REPOSITORY)
    private readonly repository: ISensorReadingWriteRepository,
    private readonly builder: SensorReadingBuilder,
  ) {}

  async execute(command: RecordSensorReadingCommand): Promise<string> {
    const id = UuidValueObject.generate().value;

    const reading = this.builder
      .withId(id)
      .withPlantId(command.plantId.value)
      .withSpaceId(command.spaceId.value)
      .withMetric(command.metric.value)
      .withValue(command.value.value)
      .withUnit(command.unit.value)
      .withMeasuredAt(command.measuredAt.value)
      .withSource(command.source.value)
      .build();

    await this.repository.save(reading);

    this.logger.log(
      `Recorded ${command.metric.value}=${command.value.value} for plant ${command.plantId.value}`,
    );
    return id;
  }
}
