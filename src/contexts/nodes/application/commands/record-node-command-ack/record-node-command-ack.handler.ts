import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RecordNodeCommandAckCommand } from '@contexts/nodes/application/commands/record-node-command-ack/record-node-command-ack.command';
import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { NodeCommandAck } from '@contexts/nodes/domain/records/node-command-ack.record';
import {
  BRIDGE_READ_REPOSITORY,
  IBridgeReadRepository,
} from '@contexts/nodes/domain/repositories/read/bridge-read.repository';
import {
  NODE_COMMAND_ACK_WRITE_REPOSITORY,
  INodeCommandAckWriteRepository,
} from '@contexts/nodes/domain/repositories/write/node-command-ack-write.repository';

@CommandHandler(RecordNodeCommandAckCommand)
export class RecordNodeCommandAckCommandHandler implements ICommandHandler<
  RecordNodeCommandAckCommand,
  void
> {
  private readonly logger = new Logger(RecordNodeCommandAckCommandHandler.name);

  constructor(
    @Inject(BRIDGE_READ_REPOSITORY)
    private readonly bridgeReadRepository: IBridgeReadRepository,
    @Inject(NODE_COMMAND_ACK_WRITE_REPOSITORY)
    private readonly nodeCommandAckWriteRepository: INodeCommandAckWriteRepository,
  ) {}

  async execute(command: RecordNodeCommandAckCommand): Promise<void> {
    const bridge = await this.bridgeReadRepository.findById(
      command.bridgeId.value,
    );

    if (
      !bridge ||
      bridge.status !== BridgeStatusEnum.ACTIVE ||
      !bridge.spaceId
    ) {
      this.logger.warn(
        `Dropping command-ack for node ${command.nodeId.value} — bridge ${command.bridgeId.value} is unknown or not claimed`,
      );
      return;
    }

    const ack = NodeCommandAck.create({
      commandId: command.commandId,
      nodeId: command.nodeId.value,
      spaceId: bridge.spaceId,
      result: command.result,
      receivedAt: command.receivedAt,
    });

    await this.nodeCommandAckWriteRepository.insert(ack);

    this.logger.log(
      `Command ack recorded for node ${command.nodeId.value} (commandId=${command.commandId ?? 'unknown'})`,
    );
  }
}
