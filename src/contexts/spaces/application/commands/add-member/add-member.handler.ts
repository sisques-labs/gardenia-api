import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { MembershipRole } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.vo';
import {
  ISpaceReadRepository,
  SPACE_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { AddMemberCommand } from './add-member.command';

@CommandHandler(AddMemberCommand)
export class AddMemberCommandHandler
  extends BaseCommandHandler<AddMemberCommand, SpaceAggregate>
  implements ICommandHandler<AddMemberCommand, void>
{
  private readonly logger = new Logger(AddMemberCommandHandler.name);

  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: AddMemberCommand): Promise<void> {
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

    space.addMember(command.targetUserId, MembershipRole.MEMBER);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Member ${command.targetUserId} added to space ${command.spaceId} by ${command.requestingUserId}`,
    );
  }
}
