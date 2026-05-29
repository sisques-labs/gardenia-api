import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { RemoveMemberCommand } from './remove-member.command';

@CommandHandler(RemoveMemberCommand)
export class RemoveMemberCommandHandler
  extends BaseCommandHandler<RemoveMemberCommand, SpaceAggregate>
  implements ICommandHandler<RemoveMemberCommand, void>
{
  private readonly logger = new Logger(RemoveMemberCommandHandler.name);

  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RemoveMemberCommand): Promise<void> {
    const space = await this.spaceReadRepository.findById(command.spaceId);

    if (!space) {
      throw new SpaceNotFoundException(command.spaceId);
    }

    const requesterMembership = space.memberships.find(
      (m) => m.userId === command.requestingUserId,
    );

    if (!requesterMembership || !requesterMembership.role.isOwner()) {
      throw new NotASpaceMemberException(
        command.requestingUserId,
        command.spaceId,
      );
    }

    space.removeMember(command.targetUserId);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Member ${command.targetUserId} removed from space ${command.spaceId} by ${command.requestingUserId}`,
    );
  }
}
