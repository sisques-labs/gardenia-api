import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import {
  IPlantStatePort,
  PLANT_STATE_PORT,
} from '@contexts/home-assistant/application/ports/plant-state.port';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';
import { PlantEntityMapper } from '@contexts/home-assistant/domain/services/plant-entity.mapper';
import { SpaceContext } from '@shared/space-context/space-context.service';

/**
 * Publishes Home Assistant MQTT Discovery + retained state for every bridged
 * space, on bootstrap and on a fixed interval. Reads happen through ports, so
 * the bridge never imports another context's domain/application directly.
 *
 * Each space is reconciled inside its own ALS frame so tenant repositories
 * scope correctly with no extra wiring (same mechanism as the request path).
 */
@Injectable()
export class HaReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HaReconcileService.name);
  private readonly config: MqttConfig;
  private readonly topics: HaTopicFactory;
  private readonly plantMapper = new PlantEntityMapper();
  private timer?: NodeJS.Timeout;

  constructor(
    configService: ConfigService,
    private readonly mqtt: MqttService,
    private readonly spaceContext: SpaceContext,
    @Inject(PLANT_STATE_PORT)
    private readonly plantStatePort: IPlantStatePort,
  ) {
    this.config = configService.getOrThrow<MqttConfig>('mqtt');
    this.topics = new HaTopicFactory(
      this.config.baseTopic,
      this.config.discoveryPrefix,
    );
  }

  onModuleInit(): void {
    if (!this.config.enabled || this.config.bridgedSpaceIds.length === 0) {
      this.logger.log(
        'Home Assistant bridge inactive (MQTT disabled or no bridged spaces)',
      );
      return;
    }

    this.timer = setInterval(
      () => void this.reconcile(),
      this.config.reconcileIntervalMs,
    );
    this.timer.unref?.();
    void this.reconcile(); // best-effort initial snapshot
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Publishes discovery + state for every bridged space. */
  async reconcile(): Promise<void> {
    for (const spaceId of this.config.bridgedSpaceIds) {
      await this.spaceContext.run(spaceId, () => this.reconcileSpace(spaceId));
    }
  }

  private async reconcileSpace(spaceId: string): Promise<void> {
    await this.mqtt.publish(this.topics.availability(spaceId), 'online', {
      retain: true,
    });

    const plants = await this.plantStatePort.listPlantStates(spaceId);
    for (const plant of plants) {
      for (const message of this.plantMapper.toMessages(
        this.topics,
        spaceId,
        plant,
      )) {
        await this.mqtt.publish(message.configTopic, message.config, {
          retain: true,
        });
        await this.mqtt.publish(message.stateTopic, message.state, {
          retain: true,
        });
      }
    }

    this.logger.log(
      `Reconciled ${plants.length} plant(s) for space ${spaceId}`,
    );
  }
}
