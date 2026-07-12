import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IKafkaConfig } from '@sisques-labs/nestjs-kit/messaging';
import { Kafka, Producer, SASLOptions } from 'kafkajs';

import {
  INodeCommandProducerPort,
  SendNodeCommandInput,
} from '@contexts/nodes/application/ports/node-command-producer.port';
import { NODES_KAFKA_TOPICS } from './nodes-kafka-topics.constants';

/**
 * Raw kafkajs producer for `gardenia-bridge.commands`, deliberately
 * gardenia-api-local rather than reusing the kit's `IEventPublisher` — that
 * port's envelope/topic scheme is shaped for domain-event forwarding, not a
 * device command. See design.md §1/§5.6. Same `IKafkaConfig` namespace and
 * `KAFKA_ENABLED` no-op gate as `KafkajsEventPublisherAdapter`.
 */
@Injectable()
export class NodesKafkaCommandProducerAdapter
  implements INodeCommandProducerPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NodesKafkaCommandProducerAdapter.name);
  private readonly config: IKafkaConfig;
  private readonly producer: Producer | null;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<IKafkaConfig>('kafka');
    this.producer = this.config.enabled ? this.createProducer() : null;
  }

  private createProducer(): Producer {
    const kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      ssl: this.config.ssl,
      ...(this.config.sasl ? { sasl: this.config.sasl as SASLOptions } : {}),
    });
    return kafka.producer({ allowAutoTopicCreation: true });
  }

  async onModuleInit(): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.connect();
      this.logger.log('Nodes command producer connected');
    } catch (error) {
      this.logger.warn(
        `Nodes command producer failed to connect at startup, will retry on send: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.disconnect();
    } catch (error) {
      this.logger.warn(
        `Nodes command producer failed to disconnect cleanly: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async send(input: SendNodeCommandInput): Promise<void> {
    if (!this.producer) return;

    await this.producer.send({
      topic: NODES_KAFKA_TOPICS.COMMANDS,
      messages: [
        {
          key: input.nodeId,
          value: JSON.stringify({
            commandId: input.commandId,
            nodeId: input.nodeId,
            commandType: input.commandType,
            payload: input.payload,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    this.logger.debug(
      `Sent command ${input.commandId} (${input.commandType}) to node ${input.nodeId}`,
    );
  }
}
