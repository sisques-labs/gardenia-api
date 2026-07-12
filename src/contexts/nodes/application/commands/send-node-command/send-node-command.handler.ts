import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SendNodeCommandCommand } from '@contexts/nodes/application/commands/send-node-command/send-node-command.command';
import {
  INodeCommandProducerPort,
  NODE_COMMAND_PRODUCER_PORT,
} from '@contexts/nodes/application/ports/node-command-producer.port';
import { AssertNodeExistsService } from '@contexts/nodes/application/services/write/assert-node-exists/assert-node-exists.service';

@CommandHandler(SendNodeCommandCommand)
export class SendNodeCommandCommandHandler implements ICommandHandler<
  SendNodeCommandCommand,
  string
> {
  private readonly logger = new Logger(SendNodeCommandCommandHandler.name);

  constructor(
    private readonly assertNodeExistsService: AssertNodeExistsService,
    @Inject(NODE_COMMAND_PRODUCER_PORT)
    private readonly nodeCommandProducer: INodeCommandProducerPort,
  ) {}

  async execute(command: SendNodeCommandCommand): Promise<string> {
    await this.assertNodeExistsService.execute(command.nodeId);

    const commandId = UuidValueObject.generate().value;

    await this.nodeCommandProducer.send({
      commandId,
      nodeId: command.nodeId.value,
      commandType: command.commandType,
      payload: command.payload,
    });

    this.logger.log(
      `Command ${commandId} (${command.commandType}) sent to node ${command.nodeId.value}`,
    );

    return commandId;
  }
}
