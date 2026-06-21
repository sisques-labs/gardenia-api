import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions, MqttClient } from 'mqtt';

import { MqttConfig } from '@core/config/mqtt.config';

import { MqttMessageHandler } from '../interfaces/mqtt-message-handler.type';
import { MqttPublishOptions } from '../interfaces/mqtt-publish-options.interface';
import { topicMatches } from '../utils/topic-matcher';

interface Subscription {
  readonly filter: string;
  readonly handler: MqttMessageHandler;
}

/**
 * Single managed connection to the MQTT broker, shared by every Home Assistant
 * bridge feature. When the transport is disabled (`MQTT_ENABLED=false`) every
 * method is a no-op so the rest of the application is unaffected.
 *
 * Tenancy is NOT enforced here — callers build space-scoped topics. This
 * service only owns the wire: connection lifecycle, (de)serialization, topic
 * routing and the process-level availability signal (LWT).
 */
@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private readonly config: MqttConfig;
  private readonly subscriptions: Subscription[] = [];
  private client?: MqttClient;

  /** Retained process-level availability topic (broker LWT target). */
  readonly availabilityTopic: string;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<MqttConfig>('mqtt');
    this.availabilityTopic = `${this.config.baseTopic}/bridge/availability`;
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  get connected(): boolean {
    return this.client?.connected ?? false;
  }

  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.log('MQTT transport disabled (MQTT_ENABLED is not "true")');
      return;
    }

    if (!this.config.url) {
      this.logger.warn('MQTT enabled but MQTT_URL is missing — not connecting');
      return;
    }

    this.connectClient(this.config.url);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    // Best-effort: mark offline before a clean shutdown, then close.
    await this.publish(this.availabilityTopic, 'offline', { retain: true });
    await new Promise<void>((resolve) =>
      this.client!.end(false, {}, () => resolve()),
    );
    this.client = undefined;
  }

  /**
   * Publishes a payload. Objects are JSON-serialized; strings/buffers are sent
   * as-is. No-op (debug log) when the transport is disabled or not connected.
   */
  async publish(
    topic: string,
    payload: unknown,
    options: MqttPublishOptions = {},
  ): Promise<void> {
    if (!this.client) {
      this.logger.debug(
        `Skipping publish to "${topic}" — broker not connected`,
      );
      return;
    }

    const message =
      typeof payload === 'string' || Buffer.isBuffer(payload)
        ? payload
        : JSON.stringify(payload);

    await new Promise<void>((resolve, reject) => {
      this.client!.publish(
        topic,
        message,
        { retain: options.retain ?? false, qos: options.qos ?? 0 },
        (error) => (error ? reject(error) : resolve()),
      );
    });
  }

  /**
   * Registers a handler for every message matching `filter` and subscribes on
   * the broker. Subscriptions are remembered and re-applied on reconnect.
   */
  async subscribe(filter: string, handler: MqttMessageHandler): Promise<void> {
    this.subscriptions.push({ filter, handler });

    if (!this.client) {
      this.logger.debug(
        `Queued subscription "${filter}" — broker not connected yet`,
      );
      return;
    }

    await this.applySubscription(filter);
  }

  private connectClient(url: string): void {
    const options: IClientOptions = {
      username: this.config.username,
      password: this.config.password,
      reconnectPeriod: 5000,
      will: {
        topic: this.availabilityTopic,
        payload: Buffer.from('offline'),
        retain: true,
        qos: 1,
      },
    };

    this.logger.log(`Connecting to MQTT broker at ${url}`);
    const client = connect(url, options);
    this.client = client;

    client.on('connect', () => {
      this.logger.log('MQTT broker connected');
      void this.publish(this.availabilityTopic, 'online', { retain: true });
      for (const { filter } of this.subscriptions) {
        void this.applySubscription(filter);
      }
    });

    client.on('reconnect', () => this.logger.warn('MQTT reconnecting…'));
    client.on('close', () => this.logger.warn('MQTT connection closed'));
    client.on('error', (error) =>
      this.logger.error(`MQTT error: ${error.message}`, error.stack),
    );

    client.on('message', (topic: string, payload: Buffer) => {
      for (const subscription of this.subscriptions) {
        if (topicMatches(subscription.filter, topic)) {
          subscription.handler(topic, payload);
        }
      }
    });
  }

  private async applySubscription(filter: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client!.subscribe(filter, { qos: 1 }, (error) =>
        error ? reject(error) : resolve(),
      );
    });
    this.logger.log(`Subscribed to "${filter}"`);
  }
}
