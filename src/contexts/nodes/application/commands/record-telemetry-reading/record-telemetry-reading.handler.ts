import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RecordTelemetryReadingCommand } from '@contexts/nodes/application/commands/record-telemetry-reading/record-telemetry-reading.command';
import { FindOrCreateNodeService } from '@contexts/nodes/application/services/write/find-or-create-node/find-or-create-node.service';
import { NodeTelemetryReading } from '@contexts/nodes/domain/records/node-telemetry-reading.record';
import {
  NODE_TELEMETRY_READING_WRITE_REPOSITORY,
  INodeTelemetryReadingWriteRepository,
} from '@contexts/nodes/domain/repositories/write/node-telemetry-reading-write.repository';

@CommandHandler(RecordTelemetryReadingCommand)
export class RecordTelemetryReadingCommandHandler implements ICommandHandler<
  RecordTelemetryReadingCommand,
  void
> {
  private readonly logger = new Logger(
    RecordTelemetryReadingCommandHandler.name,
  );

  constructor(
    private readonly findOrCreateNodeService: FindOrCreateNodeService,
    @Inject(NODE_TELEMETRY_READING_WRITE_REPOSITORY)
    private readonly nodeTelemetryReadingWriteRepository: INodeTelemetryReadingWriteRepository,
  ) {}

  async execute(command: RecordTelemetryReadingCommand): Promise<void> {
    const node = await this.findOrCreateNodeService.execute({
      nodeId: command.nodeId.value,
      bridgeId: command.bridgeId.value,
    });

    if (!node) return;

    const reading = NodeTelemetryReading.create({
      spaceId: node.spaceId.value,
      nodeId: node.id.value,
      sensorType: command.sensorType,
      value: command.value,
      unit: command.unit,
      recordedAt: command.recordedAt,
    });

    await this.nodeTelemetryReadingWriteRepository.insert(reading);

    this.logger.log(
      `Telemetry recorded for node ${node.id.value}: ${command.sensorType}=${command.value}`,
    );
  }
}
