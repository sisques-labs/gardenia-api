import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
import {
  SPACE_WRITE_REPOSITORY,
  ISpaceWriteRepository,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceEnvironmentValueObject } from '@contexts/spaces/domain/value-objects/space-environment/space-environment.value-object';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';
import { SpaceLatitudeValueObject } from '@contexts/spaces/domain/value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '@contexts/spaces/domain/value-objects/space-longitude/space-longitude.value-object';
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
      `Updating space ${command.spaceId} by user ${command.requestingUserId}`,
    );

    const space = await this.assertSpaceExistsService.execute(
      new SpaceIdValueObject(command.spaceId),
    );

    const latitude =
      command.latitude != null
        ? new SpaceLatitudeValueObject(command.latitude)
        : null;
    const longitude =
      command.longitude != null
        ? new SpaceLongitudeValueObject(command.longitude)
        : null;
    const environment =
      command.environment != null
        ? new SpaceEnvironmentValueObject(command.environment as SpaceEnvironmentEnum)
        : null;

    space.changeGeolocation(latitude, longitude, environment);

    await this.spaceWriteRepository.save(space);
  }
}
