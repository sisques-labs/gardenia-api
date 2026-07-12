import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { BootstrapBridgeCommand } from '@contexts/nodes/application/commands/bootstrap-bridge/bootstrap-bridge.command';
import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';
import { BridgeBuilder } from '@contexts/nodes/domain/builders/bridge.builder';
import {
  BRIDGE_WRITE_REPOSITORY,
  IBridgeWriteRepository,
} from '@contexts/nodes/domain/repositories/write/bridge-write.repository';

export interface BootstrapBridgeResult {
  bridgeId: string;
  pairingCode: string | null;
}

@CommandHandler(BootstrapBridgeCommand)
export class BootstrapBridgeCommandHandler
  extends BaseCommandHandler<BootstrapBridgeCommand, BridgeAggregate>
  implements ICommandHandler<BootstrapBridgeCommand, BootstrapBridgeResult>
{
  private readonly logger = new Logger(BootstrapBridgeCommandHandler.name);

  constructor(
    @Inject(BRIDGE_WRITE_REPOSITORY)
    private readonly bridgeWriteRepository: IBridgeWriteRepository,
    private readonly bridgeBuilder: BridgeBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: BootstrapBridgeCommand,
  ): Promise<BootstrapBridgeResult> {
    const now = new Date();
    let bridge = await this.bridgeWriteRepository.findById(
      command.bridgeId.value,
    );

    if (!bridge) {
      bridge = this.bridgeBuilder
        .withId(command.bridgeId.value)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build();
    }

    bridge.bootstrap();

    await this.bridgeWriteRepository.save(bridge);
    await this.publishEvents(bridge);

    this.logger.log(
      `Bridge ${bridge.id.value} bootstrapped, pairing code: ${
        bridge.pairingCode?.value ?? '(already claimed, no code issued)'
      }`,
    );

    return {
      bridgeId: bridge.id.value,
      pairingCode: bridge.pairingCode?.value ?? null,
    };
  }
}
