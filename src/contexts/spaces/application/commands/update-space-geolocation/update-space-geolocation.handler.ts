import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  SPACE_WRITE_REPOSITORY,
  ISpaceWriteRepository,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { UpdateSpaceGeolocationCommand } from './update-space-geolocation.command';

@CommandHandler(UpdateSpaceGeolocationCommand)
export class UpdateSpaceGeolocationCommandHandler
  implements ICommandHandler<UpdateSpaceGeolocationCommand, void>
{
  private readonly logger = new Logger(UpdateSpaceGeolocationCommandHandler.name);

  constructor(
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
  ) {}

  async execute(command: UpdateSpaceGeolocationCommand): Promise<void> {
    this.logger.log(
      `Updating geolocation for space ${command.spaceId} by user ${command.requestingUserId}`,
    );

    const space = await this.spaceWriteRepository.findById(command.spaceId);

    if (!space) {
      throw new NotFoundException(`Space not found: ${command.spaceId}`);
    }

    space.setGeolocation(command.latitude, command.longitude, command.environment);

    await this.spaceWriteRepository.save(space);
  }
}
