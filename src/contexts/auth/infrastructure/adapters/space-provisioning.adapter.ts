import {
  CreateDefaultSpaceInput,
  ISpaceProvisioningPort,
} from '@contexts/auth/application/ports/space-provisioning.port';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

@Injectable()
export class SpaceProvisioningAdapter implements ISpaceProvisioningPort {
  private readonly logger = new Logger(SpaceProvisioningAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async createDefaultSpace(input: CreateDefaultSpaceInput): Promise<string> {
    this.logger.log(`Provisioning default space for owner ${input.ownerId}`);

    const spaceId = await this.commandBus.execute<CreateSpaceCommand, string>(
      new CreateSpaceCommand({ ownerId: input.ownerId, name: input.name }),
    );

    this.logger.debug(`Default space created with id ${spaceId}`);

    return spaceId;
  }
}
