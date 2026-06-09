import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  ISpaceUserPort,
  SPACE_USER_PORT,
} from '@contexts/spaces/application/ports/space-user.port';
import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { AssertSpaceInvitationNotExpiredService } from '@contexts/spaces/application/services/write/assert-space-invitation-not-expired/assert-space-invitation-not-expired.service';
import { AssertUserNotSpaceMemberService } from '@contexts/spaces/application/services/write/assert-user-not-space-member/assert-user-not-space-member.service';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

import { AcceptSpaceInvitationCommand } from './accept-space-invitation.command';

export interface AcceptSpaceInvitationResult {
  spaceId: string;
  role: MembershipRoleEnum;
}

@CommandHandler(AcceptSpaceInvitationCommand)
export class AcceptSpaceInvitationCommandHandler
  extends BaseCommandHandler<AcceptSpaceInvitationCommand, SpaceAggregate>
  implements
    ICommandHandler<AcceptSpaceInvitationCommand, AcceptSpaceInvitationResult>
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
    @Inject(SPACE_USER_PORT)
    private readonly spaceUserPort: ISpaceUserPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: AcceptSpaceInvitationCommand,
  ): Promise<AcceptSpaceInvitationResult> {
    const invitation =
      await this.assertSpaceInvitationViewModelExistsByCodeService.execute(
        command.code.value,
      );

    await this.assertSpaceInvitationNotExpiredService.execute(invitation);

    await this.assertUserNotSpaceMemberService.execute({
      userId: command.acceptingUserId.value,
      spaceId: invitation.spaceId,
    });

    await this.spaceUserPort.ensureUserExists(command.acceptingUserId.value);

    const space = await this.assertSpaceExistsService.execute(
      new SpaceIdValueObject(invitation.spaceId),
    );

    space.addMember(command.acceptingUserId.value, invitation.role);
    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `User ${command.acceptingUserId.value} accepted invitation for space ${invitation.spaceId}`,
    );

    return {
      spaceId: invitation.spaceId,
      role: invitation.role,
    };
  }
}
