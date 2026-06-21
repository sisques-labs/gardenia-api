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
import {
  ISpaceSummaryPort,
  SPACE_SUMMARY_PORT,
} from '@contexts/home-assistant/application/ports/space-summary.port';
import {
  IWeatherStatePort,
  WEATHER_STATE_PORT,
} from '@contexts/home-assistant/application/ports/weather-state.port';
import {
  IInventoryStatePort,
  INVENTORY_STATE_PORT,
} from '@contexts/home-assistant/application/ports/inventory-state.port';
import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';
import { InventoryEntityMapper } from '@contexts/home-assistant/domain/services/inventory-entity.mapper';
import { PlantEntityMapper } from '@contexts/home-assistant/domain/services/plant-entity.mapper';
import { SpaceSummaryMapper } from '@contexts/home-assistant/domain/services/space-summary.mapper';
import { WeatherEntityMapper } from '@contexts/home-assistant/domain/services/weather-entity.mapper';
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
  private readonly summaryMapper = new SpaceSummaryMapper();
  private readonly weatherMapper = new WeatherEntityMapper();
  private readonly inventoryMapper = new InventoryEntityMapper();
  private timer?: NodeJS.Timeout;

  constructor(
    configService: ConfigService,
    private readonly mqtt: MqttService,
    private readonly spaceContext: SpaceContext,
    @Inject(PLANT_STATE_PORT)
    private readonly plantStatePort: IPlantStatePort,
    @Inject(SPACE_SUMMARY_PORT)
    private readonly spaceSummaryPort: ISpaceSummaryPort,
    @Inject(WEATHER_STATE_PORT)
    private readonly weatherStatePort: IWeatherStatePort,
    @Inject(INVENTORY_STATE_PORT)
    private readonly inventoryStatePort: IInventoryStatePort,
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

    const messages: HaDiscoveryMessage[] = [];

    const summary = await this.spaceSummaryPort.getSummary(spaceId);
    messages.push(
      ...this.summaryMapper.toMessages(this.topics, spaceId, summary),
    );

    const weather = await this.weatherStatePort.getWeather(spaceId);
    if (weather) {
      messages.push(
        ...this.weatherMapper.toMessages(this.topics, spaceId, weather),
      );
    }

    const plants = await this.plantStatePort.listPlantStates(spaceId);
    for (const plant of plants) {
      messages.push(
        ...this.plantMapper.toMessages(this.topics, spaceId, plant),
      );
    }

    const inventory = await this.inventoryStatePort.listInventory(spaceId);
    for (const item of inventory) {
      messages.push(
        ...this.inventoryMapper.toMessages(this.topics, spaceId, item),
      );
    }

    for (const message of messages) {
      await this.mqtt.publish(message.configTopic, message.config, {
        retain: true,
      });
      // Command-only entities (buttons) carry no state.
      if (message.stateTopic && message.state !== undefined) {
        await this.mqtt.publish(message.stateTopic, message.state, {
          retain: true,
        });
      }
    }

    this.logger.log(
      `Reconciled space ${spaceId}: ${plants.length} plant(s), ${inventory.length} item(s), ${messages.length} entities`,
    );
  }
}
