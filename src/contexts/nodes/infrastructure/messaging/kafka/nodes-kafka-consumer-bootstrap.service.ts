import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import {
  EVENT_CONSUMER,
  IEventConsumer,
  IInboundMessage,
  IKafkaConfig,
} from '@sisques-labs/nestjs-kit/messaging';

import { RecordNodeCommandAckCommand } from '@contexts/nodes/application/commands/record-node-command-ack/record-node-command-ack.command';
import { RecordNodeHeartbeatCommand } from '@contexts/nodes/application/commands/record-node-heartbeat/record-node-heartbeat.command';
import { RecordTelemetryReadingCommand } from '@contexts/nodes/application/commands/record-telemetry-reading/record-telemetry-reading.command';
import { NODES_KAFKA_TOPICS } from './nodes-kafka-topics.constants';
import { parseCommandAckMessage } from '../parsers/command-ack-message.parser';
import { parseHeartbeatMessage } from '../parsers/heartbeat-message.parser';
import { parseTelemetryMessage } from '../parsers/telemetry-message.parser';

/**
 * Bootstraps three independent Kafka consumer groups, one per inbound
 * `gardenia-bridge` topic, each dispatching a parsed message to its
 * matching internal command. `gardenia-bridge.commands` is NOT consumed
 * here — that topic is outbound-only (see `NodesKafkaCommandProducerAdapter`).
 *
 * A no-op when `KAFKA_ENABLED=false` — `EVENT_CONSUMER.run()` itself never
 * connects in that case (see `KafkajsEventConsumerAdapter`).
 */
@Injectable()
export class NodesKafkaConsumerBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(NodesKafkaConsumerBootstrapService.name);

  constructor(
    @Inject(EVENT_CONSUMER)
    private readonly consumer: IEventConsumer,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {}

  async onModuleInit(): Promise<void> {
    const clientId =
      this.configService.getOrThrow<IKafkaConfig>('kafka').clientId;

    await this.consumer.run(
      `${clientId}-nodes-telemetry`,
      [NODES_KAFKA_TOPICS.TELEMETRY],
      (message) => this.handleTelemetry(message),
    );
    await this.consumer.run(
      `${clientId}-nodes-heartbeat`,
      [NODES_KAFKA_TOPICS.HEARTBEAT],
      (message) => this.handleHeartbeat(message),
    );
    await this.consumer.run(
      `${clientId}-nodes-command-acks`,
      [NODES_KAFKA_TOPICS.COMMAND_ACKS],
      (message) => this.handleCommandAck(message),
    );
  }

  private async handleTelemetry(message: IInboundMessage): Promise<void> {
    const input = parseTelemetryMessage(message.value);
    await this.commandBus.execute(new RecordTelemetryReadingCommand(input));
  }

  private async handleHeartbeat(message: IInboundMessage): Promise<void> {
    const input = parseHeartbeatMessage(message.value);
    await this.commandBus.execute(new RecordNodeHeartbeatCommand(input));
  }

  private async handleCommandAck(message: IInboundMessage): Promise<void> {
    const input = parseCommandAckMessage(message.value);
    await this.commandBus.execute(new RecordNodeCommandAckCommand(input));
  }
}
