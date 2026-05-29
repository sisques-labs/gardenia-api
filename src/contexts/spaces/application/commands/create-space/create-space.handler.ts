import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceLimitExceededException } from '@contexts/spaces/domain/exceptions/space-limit-exceeded.exception';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { CreateSpaceCommand } from './create-space.command';

@CommandHandler(CreateSpaceCommand)
export class CreateSpaceCommandHandler
  extends BaseCommandHandler<CreateSpaceCommand, SpaceAggregate>
  implements ICommandHandler<CreateSpaceCommand, string>
{
  private readonly logger = new Logger(CreateSpaceCommandHandler.name);

  constructor(
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    private readonly configService: ConfigService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateSpaceCommand): Promise<string> {
    const maxSpaces = this.configService.get<number>('MAX_SPACES_PER_USER', 5);
    const ownedCount = await this.membershipReadRepository.countByOwner(
      command.ownerId,
    );

    if (ownedCount >= maxSpaces) {
      throw new SpaceLimitExceededException(command.ownerId, maxSpaces);
    }

    const space = SpaceAggregate.create(command.ownerId, command.name);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Space created: ${space.id.value} for owner: ${command.ownerId}`,
    );

    return space.id.value;
  }
}
