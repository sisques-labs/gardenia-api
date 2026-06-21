import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { ISensorIngestPort } from '@contexts/home-assistant/application/ports/sensor-ingest.port';
import { RecordSensorReadingCommand } from '@contexts/sensor-readings/application/commands/record-sensor-reading/record-sensor-reading.command';

/**
 * Persists an ingested HA reading via the Command bus. Boundary-safe: only this
 * adapter references the sensor-readings context.
 */
@Injectable()
export class SensorIngestAdapter implements ISensorIngestPort {
  private readonly logger = new Logger(SensorIngestAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async recordReading(
    spaceId: string,
    plantId: string,
    metric: string,
    value: number,
    unit?: string,
  ): Promise<void> {
    this.logger.log(
      `Ingesting ${metric}=${value} for plant ${plantId} (space ${spaceId})`,
    );

    await this.commandBus.execute(
      new RecordSensorReadingCommand({
        plantId,
        spaceId,
        metric,
        value,
        unit,
        source: 'home_assistant',
      }),
    );
  }
}
