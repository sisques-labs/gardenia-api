import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import {
  HA_WRITE_PORT,
  IHaWritePort,
} from '@contexts/home-assistant/application/ports/ha-write.port';
import { SpaceContext } from '@shared/space-context/space-context.service';

/**
 * Inbound MQTT transport: subscribes to Home Assistant command topics
 * (`{base}/{space}/{entity}/{id}/{action}/set`) and dispatches the matching
 * Gardenia write through {@link IHaWritePort}, inside the space's ALS frame.
 *
 * Only acts on spaces this process bridges; commands for any other space (or
 * malformed topics/payloads) are ignored.
 */
@Injectable()
export class HaCommandRouter implements OnModuleInit {
  private readonly logger = new Logger(HaCommandRouter.name);
  private readonly config: MqttConfig;

  constructor(
    configService: ConfigService,
    private readonly mqtt: MqttService,
    private readonly spaceContext: SpaceContext,
    @Inject(HA_WRITE_PORT)
    private readonly writePort: IHaWritePort,
  ) {
    this.config = configService.getOrThrow<MqttConfig>('mqtt');
  }

  async onModuleInit(): Promise<void> {
    if (!this.config.enabled || this.config.bridgedSpaceIds.length === 0) {
      return;
    }

    const filter = `${this.config.baseTopic}/+/+/+/+/set`;
    await this.mqtt.subscribe(filter, (topic, payload) => {
      void this.handle(topic, payload.toString('utf8'));
    });
  }

  private async handle(topic: string, payload: string): Promise<void> {
    const segments = topic.split('/');
    // base / space / entity / id / action / "set"
    if (segments.length !== 6 || segments[5] !== 'set') return;

    const [base, spaceId, entity, id, action] = segments;
    if (base !== this.config.baseTopic) return;
    if (!this.config.bridgedSpaceIds.includes(spaceId)) {
      this.logger.warn(`Ignoring command for non-bridged space ${spaceId}`);
      return;
    }

    this.logger.log(
      `HA command ${entity}/${id}/${action} for space ${spaceId}`,
    );

    try {
      await this.spaceContext.run(spaceId, () =>
        this.dispatch(spaceId, entity, id, action, payload),
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle command ${topic}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async dispatch(
    spaceId: string,
    entity: string,
    id: string,
    action: string,
    payload: string,
  ): Promise<void> {
    if (entity === 'plant' && action === 'water') {
      await this.writePort.recordWatering(spaceId, id);
      return;
    }

    if (entity === 'inventory' && action === 'adjust') {
      const delta = Number(payload);
      if (!Number.isFinite(delta) || delta === 0) {
        this.logger.warn(`Ignoring inventory adjust with payload "${payload}"`);
        return;
      }
      await this.writePort.adjustInventory(spaceId, id, delta);
      return;
    }

    this.logger.warn(`Unknown HA command ${entity}/${action}`);
  }
}
