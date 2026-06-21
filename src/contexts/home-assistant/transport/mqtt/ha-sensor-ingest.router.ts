import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import {
  ISensorIngestPort,
  SENSOR_INGEST_PORT,
} from '@contexts/home-assistant/application/ports/sensor-ingest.port';
import { SpaceContext } from '@shared/space-context/space-context.service';

/**
 * Inbound MQTT transport for physical sensor readings from Home Assistant.
 * HA automations publish numeric values to
 * `{base}/{space}/plant/{plantId}/{metric}/reading`; this router persists them
 * as `sensor-readings`, scoped to the (bridged) space.
 */
@Injectable()
export class HaSensorIngestRouter implements OnModuleInit {
  private readonly logger = new Logger(HaSensorIngestRouter.name);
  private readonly config: MqttConfig;

  constructor(
    configService: ConfigService,
    private readonly mqtt: MqttService,
    private readonly spaceContext: SpaceContext,
    @Inject(SENSOR_INGEST_PORT)
    private readonly ingestPort: ISensorIngestPort,
  ) {
    this.config = configService.getOrThrow<MqttConfig>('mqtt');
  }

  async onModuleInit(): Promise<void> {
    if (!this.config.enabled || this.config.bridgedSpaceIds.length === 0) {
      return;
    }

    const filter = `${this.config.baseTopic}/+/plant/+/+/reading`;
    await this.mqtt.subscribe(filter, (topic, payload) => {
      void this.handle(topic, payload.toString('utf8'));
    });
  }

  private async handle(topic: string, payload: string): Promise<void> {
    const segments = topic.split('/');
    // base / space / "plant" / plantId / metric / "reading"
    if (segments.length !== 6 || segments[5] !== 'reading') return;

    const [base, spaceId, entity, plantId, metric] = segments;
    if (base !== this.config.baseTopic || entity !== 'plant') return;
    if (!this.config.bridgedSpaceIds.includes(spaceId)) {
      this.logger.warn(`Ignoring reading for non-bridged space ${spaceId}`);
      return;
    }

    const value = Number(payload);
    if (!Number.isFinite(value)) {
      this.logger.warn(`Ignoring non-numeric reading "${payload}" on ${topic}`);
      return;
    }

    this.logger.log(`Ingesting ${metric} reading for plant ${plantId}`);
    try {
      await this.spaceContext.run(spaceId, () =>
        this.ingestPort.recordReading(spaceId, plantId, metric, value),
      );
    } catch (error) {
      this.logger.error(
        `Failed to ingest reading ${topic}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
