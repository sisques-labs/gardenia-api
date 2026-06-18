import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  SPACE_WRITE_REPOSITORY,
  ISpaceWriteRepository,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';

import { UpdateSpaceCommand } from './update-space.command';

@CommandHandler(UpdateSpaceCommand)
export class UpdateSpaceCommandHandler
  implements ICommandHandler<UpdateSpaceCommand, void>
{
  private readonly logger = new Logger(UpdateSpaceCommandHandler.name);

  constructor(
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    private readonly assertSpaceExistsService: AssertSpaceExistsService,
  ) {}

  async execute(command: UpdateSpaceCommand): Promise<void> {
    this.logger.log(
      `Updating space ${command.spaceId.value} by user ${command.requestingUserId.value}`,
    );

    const space = await this.assertSpaceExistsService.execute(command.spaceId);

    space.update({
      name: command.name,
      latitude: command.latitude,
      longitude: command.longitude,
      environment: command.environment,
    });

    await this.spaceWriteRepository.save(space);
  }
}
