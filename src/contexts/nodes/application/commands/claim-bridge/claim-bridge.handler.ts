import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { ClaimBridgeCommand } from '@contexts/nodes/application/commands/claim-bridge/claim-bridge.command';
import { AssertBridgeExistsService } from '@contexts/nodes/application/services/write/assert-bridge-exists/assert-bridge-exists.service';
import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';
import {
  BRIDGE_WRITE_REPOSITORY,
  IBridgeWriteRepository,
} from '@contexts/nodes/domain/repositories/write/bridge-write.repository';

@CommandHandler(ClaimBridgeCommand)
export class ClaimBridgeCommandHandler
  extends BaseCommandHandler<ClaimBridgeCommand, BridgeAggregate>
  implements ICommandHandler<ClaimBridgeCommand, void>
{
  private readonly logger = new Logger(ClaimBridgeCommandHandler.name);

  constructor(
    @Inject(BRIDGE_WRITE_REPOSITORY)
    private readonly bridgeWriteRepository: IBridgeWriteRepository,
    private readonly assertBridgeExistsService: AssertBridgeExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: ClaimBridgeCommand): Promise<void> {
    const bridge = await this.assertBridgeExistsService.execute(
      command.bridgeId,
    );

    bridge.claim(command.spaceId, command.pairingCode);

    await this.bridgeWriteRepository.save(bridge);
    await this.publishEvents(bridge);

    this.logger.log(
      `Bridge ${bridge.id.value} claimed into space ${command.spaceId}`,
    );
  }
}
