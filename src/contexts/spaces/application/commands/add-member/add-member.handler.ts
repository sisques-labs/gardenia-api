import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
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
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: AddMemberCommand): Promise<void> {
    const space = await this.spaceWriteRepository.findById(
      command.spaceId.value,
    );

    if (!space) {
      throw new SpaceNotFoundException(command.spaceId.value);
    }

    const requesterMembership = space.memberships.find(
      (m) => m.userId === command.requestingUserId.value,
    );

    if (!requesterMembership || !requesterMembership.role.isOwner()) {
      throw new NotASpaceMemberException(
        command.requestingUserId.value,
        command.spaceId.value,
      );
    }

    space.addMember(command.targetUserId.value, MembershipRoleEnum.MEMBER);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Member ${command.targetUserId.value} added to space ${command.spaceId.value} by ${command.requestingUserId.value}`,
    );
  }
}
