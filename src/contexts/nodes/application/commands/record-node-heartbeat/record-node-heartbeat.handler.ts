import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { RecordNodeHeartbeatCommand } from '@contexts/nodes/application/commands/record-node-heartbeat/record-node-heartbeat.command';
import { FindOrCreateNodeService } from '@contexts/nodes/application/services/write/find-or-create-node/find-or-create-node.service';
import {
  NODE_WRITE_REPOSITORY,
  INodeWriteRepository,
} from '@contexts/nodes/domain/repositories/write/node-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';

@CommandHandler(RecordNodeHeartbeatCommand)
export class RecordNodeHeartbeatCommandHandler implements ICommandHandler<
  RecordNodeHeartbeatCommand,
  void
> {
  private readonly logger = new Logger(RecordNodeHeartbeatCommandHandler.name);

  constructor(
    private readonly findOrCreateNodeService: FindOrCreateNodeService,
    @Inject(NODE_WRITE_REPOSITORY)
    private readonly nodeWriteRepository: INodeWriteRepository,
    private readonly spaceContext: SpaceContext,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RecordNodeHeartbeatCommand): Promise<void> {
    const node = await this.findOrCreateNodeService.execute({
      nodeId: command.nodeId.value,
      bridgeId: command.bridgeId.value,
    });

    if (!node) return;

    node.markOnline();
    node.touchLastSeen(command.seenAt);

    await this.spaceContext.run(node.spaceId.value, async () => {
      await this.nodeWriteRepository.save(node);
    });
    await this.eventBus.publishAll(node.getUncommittedEvents());
    await node.commit();

    this.logger.log(`Heartbeat recorded for node ${node.id.value}`);
  }
}
