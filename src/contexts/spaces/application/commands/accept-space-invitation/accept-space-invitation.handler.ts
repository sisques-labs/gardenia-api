import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { AssertSpaceInvitationNotExpiredService } from '@contexts/spaces/application/services/write/assert-space-invitation-not-expired/assert-space-invitation-not-expired.service';
import { AssertUserNotSpaceMemberService } from '@contexts/spaces/application/services/write/assert-user-not-space-member/assert-user-not-space-member.service';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

import { AcceptSpaceInvitationCommand } from './accept-space-invitation.command';

@CommandHandler(AcceptSpaceInvitationCommand)
export class AcceptSpaceInvitationCommandHandler
  extends BaseCommandHandler<AcceptSpaceInvitationCommand, SpaceAggregate>
  implements ICommandHandler<AcceptSpaceInvitationCommand, string>
{
  private readonly logger = new Logger(
    AcceptSpaceInvitationCommandHandler.name,
  );

  constructor(
    private readonly assertSpaceInvitationViewModelExistsByCodeService: AssertSpaceInvitationViewModelExistsByCodeService,
    private readonly assertSpaceInvitationNotExpiredService: AssertSpaceInvitationNotExpiredService,
    private readonly assertUserNotSpaceMemberService: AssertUserNotSpaceMemberService,
    private readonly assertSpaceExistsService: AssertSpaceExistsService,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: AcceptSpaceInvitationCommand): Promise<string> {
    const invitation =
      await this.assertSpaceInvitationViewModelExistsByCodeService.execute(
        command.code.value,
      );

    await this.assertSpaceInvitationNotExpiredService.execute(invitation);

    try {
      await this.assertUserNotSpaceMemberService.execute({
        userId: command.acceptingUserId.value,
        spaceId: invitation.spaceId,
      });
    } catch (error) {
      if (error instanceof DuplicateMembershipException) {
        this.logger.log(
          `User ${command.acceptingUserId.value} already member of space ${invitation.spaceId} (idempotent accept)`,
        );
        return invitation.spaceId;
      }
      throw error;
    }

    const space = await this.assertSpaceExistsService.execute(
      new SpaceIdValueObject(invitation.spaceId),
    );

    space.addMember(command.acceptingUserId.value, invitation.role);
    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `User ${command.acceptingUserId.value} accepted invitation for space ${invitation.spaceId}`,
    );

    return invitation.spaceId;
  }
}
